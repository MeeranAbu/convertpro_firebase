import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import cors from 'cors';
import * as functions from 'firebase-functions';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(
    cors({
        origin: '*',
    })
);

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
} else {
    console.error('FFmpeg binary not found');
    process.exit(1);
}

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/convert', upload.single('video'), async (req: any, res: any) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).send('No file uploaded');
        }

        const inputPath = file.path;
        const outputPath = `uploads/${file.filename}.mp3`;

        ffmpeg(inputPath)
            .output(outputPath)
            .on('end', () => {
                res.download(outputPath, 'output.mp3', (err: any) => {
                    if (err) console.error(err);

                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                    deleteFile(inputPath);
                    deleteFile(outputPath);
                });
            })
            .on('error', (err) => {
                console.error('Conversion error:', err);
                res.status(500).send('Conversion failed');
            })
            .run();
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

export const api = functions.https.onRequest(app);

const deleteFile = (filePath: string) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Error deleting file: ${filePath}`, err);
            });
        }
    } catch (error) {
        console.error('Error in deleteFile', error);
    }
};
