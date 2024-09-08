import { srcs, wait, udl } from "./utils.js"
import Profile from "./profile.js"

class Note {
  constructor({
    proxy = srcs.proxy,
    render_with = srcs.render,
    note_src = srcs.note,
    notelib_src = srcs.notelib,
    pid,
    profile = {},
    ao = {},
    ar = {},
  } = {}) {
    this.__type__ = "note"
    if (profile?.__type__ === "profile") {
      this.profile = profile
    } else {
      let _profile = typeof profile === "object" ? profile : {}
      if (!_profile.ao) _profile.ao = ao
      if (!_profile.ar) _profile.ar = ar
      this.profile = new Profile(profile)
    }
    this.ao = this.profile.ao
    this.ar = this.ao.ar
    this.render_with = render_with
    this.note_src = note_src
    this.notelib_src = notelib_src
    this.pid = pid
    this.proxy = proxy
  }

  async init(jwk) {
    await this.profile.init(jwk)
    return this
  }

  async create({
    jwk,
    src = this.note_src,
    library = this.notelib_src,
    data,
    info: { title, description, thumbnail, thumbnail_data, thumbnail_type },
    token: { fraction = "1" },
    udl: { payment, access, derivations, commercial, training },
    cb,
  }) {
    const creator = this.profile.id
    if (!creator) return { err: "no ao profile id" }
    const date = Date.now()
    let tags = {
      Action: "Add-Uploaded-Asset",
      Title: title,
      Description: description,
      "Date-Created": Number(date).toString(),
      Implements: "ANS-110",
      Type: "blog-post",
      "Asset-Type": "Atomic-Note",
      "Render-With": this.render_with,
      "Content-Type": "text/markdown",
      ...udl({ payment, access, derivations, commercial, training }),
    }
    if (!/^\s*$/.test(thumbnail)) tags["Thumbnail"] = thumbnail
    if (creator) tags["Creator"] = creator
    const balance =
      typeof fraction === "number" ? Number(fraction * 1).toString() : fraction
    const fills = {
      NAME: title,
      CREATOR: creator,
      TICKER: "ATOMIC",
      DENOMINATION: "1",
      DESCRIPTION: description,
      THUMBNAIL: thumbnail ?? "None",
      DATECREATED: date,
      BALANCE: balance,
    }

    let fns = [
      {
        fn: "deploy",
        args: { loads: [{ src: library }, { src, fills }], tags, data },
        then: ({ pid }) => {
          this.pid = pid
        },
      },
      { fn: this.allow, bind: this },
      { fn: this.assignData, bind: this },
      { fn: this.add, bind: this, args: { id: creator } },
    ]
    if (!thumbnail && thumbnail_data && thumbnail_type) {
      fns.unshift({
        fn: "post",
        args: {
          data: new Uint8Array(thumbnail_data),
          tags: { "Content-Type": thumbnail_type },
        },
        then: ({ args, id }) => {
          args.loads[1].fills.THUMBNAIL = id
          args.tags.Thumbnail = id
        },
      })
    }
    return this.ao.pipe({ jwk, fns, cb })
  }

  async allow() {
    return await this.ao.msg({
      pid: this.proxy,
      act: "Allow",
      checkData: "allowed!",
    })
  }

  async assignData() {
    return await this.ao.asgn({
      pid: this.proxy,
      mid: this.pid,
      check: { Action: "Assigned" },
    })
  }

  async get(version) {
    let tags = {}
    if (version) tags.Version = version
    const { err, out } = await this.ao.dry({
      act: "Get",
      pid: this.pid,
      check: { Data: true },
      tags,
      get: { obj: { version: "Version", data: "Data", date: "Date" } },
    })
    return out ?? null
  }

  async info() {
    const { err, out } = await this.ao.dry({
      pid: this.pid,
      act: "Info",
      checkData: true,
      get: { data: true, json: true },
    })
    return out ?? null
  }

  async updateInfo({
    title,
    description,
    thumbnail,
    thumbnail_data,
    thumbnail_type,
    jwk,
    cb,
  }) {
    let info_map = {
      Name: title,
      Description: description,
      Thumbnail: thumbnail,
    }
    let new_info = []
    for (const k in info_map) {
      if (info_map[k])
        new_info.push(`${k} = '${info_map[k].replace(/'/g, "\\'")}'`)
    }
    const isThumbnail = !thumbnail && thumbnail_data && thumbnail_type
    if (new_info.length === 0 && !isThumbnail) return { err: "empty info" }
    let fns = [
      { fn: "eval", args: { pid: this.pid, data: new_info.join("\n") } },
    ]
    let images = 0
    if (isThumbnail) {
      images++
      fns.unshift({
        fn: "post",
        args: {
          data: new Uint8Array(thumbnail_data),
          tags: { "Content-Type": thumbnail_type },
        },
        then: ({ args, id, out }) => {
          images--
          out.thumbnail = id
          if (images === 0) args.data += `\nThumbnail = '${id}'`
        },
      })
    }
    return await this.ao.pipe({ jwk, fns, cb })
  }

  async list() {
    const { err, out } = await this.ao.dry({
      pid: this.pid,
      act: "List",
      check: { Versions: true },
      get: { name: "Versions", json: true },
    })
    return out ?? null
  }

  async update(data, version) {
    let err = null
    let res = null
    const patches = await this.patches(data)
    if (!patches) {
      err = "something went wrong"
    } else {
      const { res: _res, err: _err } = await this.updateVersion(
        patches,
        version,
      )
      if (_err) err = _err
      res = _res
    }
    return { err, res }
  }

  async patches(data) {
    const { err, out } = await this.ao.dry({
      pid: this.pid,
      act: "Patches",
      data,
      check: { Patches: true },
      get: "Patches",
    })
    return out ?? null
  }

  async updateVersion(patches, version) {
    return await this.ao.msg({
      pid: this.pid,
      act: "Update",
      tags: { Version: version },
      data: patches,
      checkData: "updated!",
    })
  }

  async add({ id }) {
    return await this.ao.msg({
      pid: this.pid,
      act: "Add-Asset-To-Profile",
      tags: { ProfileProcess: id },
      check: { Action: "Add-Uploaded-Asset" },
    })
  }

  async editors() {
    const { err, out } = await this.ao.dry({
      pid: this.pid,
      act: "Editors",
      check: { Editors: true },
      get: { name: "Editors", json: true },
    })
    return err ? null : out
  }

  async addEditor(editor) {
    return await this.ao.msg({
      pid: this.pid,
      act: "Add-Editor",
      tags: { Editor: editor },
      checkData: "editor added!",
      get: { name: "Editors", json: true },
    })
  }

  async removeEditor(editor) {
    return await this.ao.msg({
      pid: this.pid,
      act: "Remove-Editor",
      tags: { Editor: editor },
      checkData: "editor removed!",
      get: { name: "Editors", json: true },
    })
  }
}

export default Note
