import { expect } from "chai"
import { AR, Notebook, Note, AO, Profile } from "../src/index.js"
import { Src, setup, ok, fail } from "./lib/utils.js"
import { wait } from "../src/utils.js"

const v1 = "# this is markdown 1"
const v2 = "# this is markdown 2"
const v3 = "# this is markdown 3"
const v4 = "# this is markdown 4"
const v5 = "# this is markdown 5"
const v6 = "# this is markdown 6"

const note_tags = {
  title: "title",
  description: "desc",
  thumbnail: "None",
  banner: "None",
}

const prof = {
  DisplayName: "Atom",
  UserName: "Atom",
  ProfileImage: "None",
  Description: "The Permaweb Hacker",
  CoverImage: "None",
}

describe("Atomic Notes", function () {
  this.timeout(0)
  let ao, opt, profile, ar
  let profile_pid, notebook, notebook_pid, note, note_pid, ar2, note2

  before(async () => {
    ;({ opt, ao, ar, profile } = await setup())
  })

  it("should auto-load ArConnect wallet", async () => {
    const _jwk = ar.jwk
    const arconnect = new AR(opt.ar)
    const { addr, jwk, pub } = await arconnect.gen("10")
    globalThis.window = {
      arweaveWallet: {
        walletName: "ArConnect",
        test: true,
        jwk,
        connect: async () => {},
        getActiveAddress: async () => addr,
        getActivePublicKey: async () => pub,
        sign: async tx => {
          await arconnect.arweave.transactions.sign(tx, jwk)
          return tx
        },
      },
    }
    globalThis.arweaveWallet = globalThis.window.arweaveWallet

    const ar2 = await new AR(opt.ar).init()
    expect((await ar2.checkWallet()).addr).to.eql(addr)

    const ar3 = new AR(opt.ar)
    const { addr: addr2, jwk: jwk2, pub: pub2 } = await ar3.gen()

    const ar4 = await new AR(opt.ar).init()
    expect((await ar4.balance()) * 1).to.eql(10)

    const ar5 = await new AR(opt.ar).init()
    await ar5.transfer("5", ar3.addr)
    expect((await ar5.balance()) * 1).to.eql(5)

    const pr6 = await new Profile({ ...opt.profile, ao }).init()
    await pr6.createProfile({ profile: prof })
    expect((await pr6.profile()).DisplayName).to.eql(prof.DisplayName)

    const pr7 = await new Profile({ ...opt.profile, ao }).init()
    globalThis.window = {
      arweaveWallet: {
        walletName: "ArConnect",
        test: true,
        jwk,
        connect: async () => {},
        getActiveAddress: async () => addr2,
        getActivePublicKey: async () => pub2,
        sign: async tx => {
          await arconnect.arweave.transactions.sign(tx, jwk2)
          return tx
        },
      },
    }
    globalThis.arweaveWallet = globalThis.window.arweaveWallet
    expect((await pr7.createProfile({ profile: prof })).err).to.eql(
      "the wrong wallet",
    )
    await pr7.init(arweaveWallet)
    expect((await pr7.createProfile({ profile: prof })).err).to.eql(null)
    await ar.init(_jwk)
  })

  it("should create an AO profile", async () => {
    ;({ pid: profile_pid } = ok(await profile.createProfile({ profile: prof })))
    expect((await profile.profile()).DisplayName).to.eql(prof.DisplayName)
  })

  it("should create a notebook", async () => {
    notebook = new Notebook({ ...opt.notebook, profile })
    ;({ pid: notebook_pid } = ok(
      await notebook.create({
        info: { title: "title", description: "desc" },
        bazar: true,
      }),
    ))
    expect((await notebook.get(profile.id)).Collections[0].Id).to.eql(
      notebook_pid,
    )
    expect((await notebook.info()).Name).to.eql("title")
  })

  it("should update a notebook", async () => {
    ok(await notebook.updateInfo({ title: "title2" }))
    expect((await notebook.info()).Name).to.eql("title2")
  })

  it("should create a note", async () => {
    note = new Note({ ...opt.note, profile })
    ;({ pid: note_pid } = ok(
      await note.create({
        data: v1,
        info: note_tags,
        token: { fraction: "100" },
        udl: {
          payment: { mode: "single", recipient: ao.addr },
          access: { mode: "one-time", fee: "1.3" },
          derivations: {
            mode: "allowed",
            term: "one-time",
            share: "5.0",
            fee: "1.0",
          },
          commercial: {
            mode: "allowed",
            term: "one-time",
            share: "5.0",
            fee: "1.0",
          },
          training: { mode: "allowed", term: "one-time", fee: "0.1" },
        },
      }),
    ))

    expect((await note.info()).Name).to.eql("title")
  })

  it("should update a note", async () => {
    ok(await note.updateInfo({ title: "title2" }))
    expect((await note.info()).Name).to.eql("title2")
  })

  it("should add a note to a notebook", async () => {
    ok(await notebook.addNote(note.pid))
    expect((await notebook.info()).Assets).to.eql([note.pid])
  })

  it("should remove a note from a notebook", async () => {
    ok(await notebook.removeNote(note.pid))
    expect((await notebook.info()).Assets).to.eql([])
  })

  it("should add notes to a notebook", async () => {
    ok(await notebook.addNotes([note.pid]))
    expect((await notebook.info()).Assets).to.eql([note.pid])
  })

  it("should remove notes from a notebook", async () => {
    ok(await notebook.removeNotes([note.pid]))
    expect((await notebook.info()).Assets).to.eql([])
  })

  it("should update the version with new content", async () => {
    expect((await note.get()).data).to.eql(v1)
    expect((await note.list())[0].version).to.eql("0.0.1")
    ok(await note.update(v2, "0.0.2"))
    return
    expect((await note.get()).data).to.eql(v2)
    expect((await note.list())[1].version).to.eql("0.0.2")
  })

  it("should add an editor", async () => {
    expect((await note.get("0.0.1")).data).to.eql(v1)
    expect(await note.editors()).to.eql([ar.addr])
    ar2 = new AR(opt.ar)
    await ar2.gen("10")
    await ar2.transfer("5", ar.addr)
    const _ao2 = new AO({ ...opt.ao, ar: ar2 })
    const _pr2 = new Profile({ ...opt.profile, ao: _ao2 })
    note2 = new Note({ pid: note_pid, ...opt.note, profile: _pr2 })
    ok(await note.addEditor(ar2.addr))
    expect(await note.editors()).to.eql([ar.addr, ar2.addr])
    ok(await note2.update(v3, "0.0.3"))
    expect((await note.get()).data).to.eql(v3)
    expect((await note.list())[2].version).to.eql("0.0.3")
  })

  it("should remove an editor", async () => {
    ok(await note.removeEditor(ar2.addr))
    expect(await note.editors()).to.eql([ar.addr])
    fail(await note2.update(v4, "0.0.4"))
    expect((await note.get()).data).to.eql(v3)
  })

  it("should bump with major/minor/patch", async () => {
    ok(await note.update(v4, "minor"))
    expect((await note.get()).version).to.eql("0.1.0")
    ok(await note.update(v5, "patch"))
    expect((await note.get()).version).to.eql("0.1.1")
    ok(await note.update(v6, "major"))
    expect((await note.get()).version).to.eql("1.0.0")
  })

  it("should return the correct notebook info", async () => {
    const info = await profile.info()
    expect(info.Collections[0].Id).to.eql(notebook_pid)
    expect(info.Assets[0].Id).to.eql(note_pid)
    expect(info.Owner).to.eql(ar.addr)
    expect(info.Id).to.eql(profile.id)
  })

  it("should init AR with an existing jwk", async () => {
    const _ar = await new AR(opt.ar).init(ar.jwk)
    expect(_ar.jwk).to.eql(ar.jwk)
    expect(_ar.addr).to.eql(ar.addr)
    const _ao = new AO({ ...opt.ao, ar: _ar })
    expect(_ao.ar.jwk).to.eql(ar.jwk)
    expect(_ao.ar.addr).to.eql(ar.addr)
    const _pr = new Profile({ ...opt.pr, ao: _ao })
    expect(_pr.ar.jwk).to.eql(ar.jwk)
    expect(_pr.ar.addr).to.eql(ar.addr)
  })
})
