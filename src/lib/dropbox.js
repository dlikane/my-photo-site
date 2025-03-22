import { Dropbox } from "dropbox"

const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN })

export async function uploadToDropbox(path, buffer) {
    try {
        const uploadRes = await dbx.filesUpload({
            path,
            contents: buffer,
            mode: "add"
        })

        const linkRes = await dbx.filesGetTemporaryLink({ path: uploadRes.result.path_lower })
        return { link: linkRes.result.link }
    } catch (err) {
        console.error("Dropbox upload error", err)
        return null
    }
}
