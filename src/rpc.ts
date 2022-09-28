import RPC from "discord-rpc"

const clientId = "1024607566648578058"

const rpc = new RPC.Client({ transport: "ipc" })

export const rpcLogin = () => new Promise<RPC.Client>((resolve, reject) => {
    rpc.login({ clientId }).then(resolve).catch(reject)
})