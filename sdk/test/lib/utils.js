import { readFileSync } from "fs"
import { resolve } from "path"
import { AO } from "../../src/index.js"
import { wait } from "../../src/utils.js"
import { expect } from "chai"
class Src {
  constructor({ ao, base = "../../src/lua" }) {
    this.ao = ao
    this.base = base
  }
  async upload(file, ext = "lua") {
    const data = readFileSync(
      resolve(import.meta.dirname, `${this.base}/${file}.${ext}`),
      ext === "wasm" ? null : "utf8",
    )
    return await this.ao.post({ data })
  }
}

const aoconnect = {
  MU_URL: "http://localhost:4002",
  CU_URL: "http://localhost:4004",
  GATEWAY_URL: "http://localhost:4000",
}
const arweave = { port: 4000 }

const setup = async () => {
  console.error = () => {}
  console.warn = () => {}
  const ao = new AO({ aoconnect, arweave })
  await ao.gen("10")
  const src = new Src({ ao })

  const library = await src.upload("atomic-note-library")
  const registry = await src.upload("registry000")
  const profile = await src.upload("profile000")
  ao.profile_src = profile
  const collection_registry = await src.upload("collection-registry")
  const collection = await src.upload("collection")
  const atomic_note = await src.upload("atomic-note")
  const proxy = await src.upload("proxy")

  const wasm = await src.upload("aos-sqlite", "wasm")
  const module = await ao.postModule({ data: await ao.data(wasm) })
  ao.module = module

  const wasm2 = await src.upload("aos", "wasm")
  const module2 = await ao.postModule({ data: await ao.data(wasm2) })

  const scheduler = await ao.postScheduler({ url: "http://su" })
  ao.scheduler = scheduler

  const { pid: registry_pid } = await ao.deploy({
    src: registry,
  })
  ao.registry = registry_pid
  await ao.initRegistry({ registry: registry_pid })
  await wait(1000)
  const { pid: collection_registry_pid } = await ao.deploy({
    src: collection_registry,
  })

  return {
    collection_registry_pid,
    registry_pid,
    library,
    registry,
    profile,
    collection_registry,
    collection,
    atomic_note,
    proxy,
    module,
    module2,
    scheduler,
    ao,
  }
}
const ok = obj => {
  expect(obj.err).to.eql(null)
  return obj
}
const fail = obj => {
  expect(obj.err).to.not.eql(null)
  return obj
}

export { Src, setup, ok, fail }
