import path from 'path'
import fsPromises from 'fs/promises'
import textToSpeech from '@google-cloud/text-to-speech'

main()

async function main () {
  try {
    const {pathname} = new URL(import.meta.url)
    const basedir = path.dirname(pathname)
    const date = new Date().toISOString().replace(/[-:]/g, '')
    const dirname = path.join(basedir, 'output', date)
    await fsPromises.mkdir(dirname, {recursive: true})

    const sourceDefault = path.join(basedir, 'input.txt')
    const source = process.env.SOURCE || sourceDefault
    const texts = (await fsPromises.readFile(source))
      .toString()
      .split('\n')
      .filter(line => !/^\s*$/.test(line))

    let i = 0

    for (const text of texts) {
      const number = ('' + i).padStart(2, '0')
      const title = text.replace(/\//g, '-')
      const basename = `${number}.${title}.mp3`
      const destination = path.join(dirname, basename)

      const client = new textToSpeech.TextToSpeechClient()
      const request = {
        input:{text},
        voice: {
          languageCode: 'ja-jp',
          name: 'ja-JP-Standard-A',
          ssmlGender: 'FEMALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      }

      const [response] = await client.synthesizeSpeech(request)

      if (response.error) {
        throw response.error
      }

      const buffer = Buffer.from(response.audioContent, 'base64')
      await fsPromises.writeFile(destination, buffer)

      i += 1
    }
  } catch (err) {
    console.error(err)
  }
}
