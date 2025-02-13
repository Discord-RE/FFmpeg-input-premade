import ffmpeg, { type FfmpegCommand } from "fluent-ffmpeg";
import { PassThrough } from "node:stream";
import { randomInclusive } from "../utils.js";

/**
 * Required packages: `fluent-ffmpeg`
 * 
 * Required external app: `ffmpeg`
 * 
 * Note: For optimal low-latency operation (<0.5s) for livestreaming, specify
 * `readrateInitialBurst: 10` in the `playStream` settings
 * 
 * Required settings for streaming software:
 * - Rate control: CBR
 * - B-frames: 0
 * - Keyframe duration: 1s
 */

function addLowLatencyFlags(ffmpeg: FfmpegCommand)
{
    ffmpeg
        .addOption(
            '-fflags', 'nobuffer',
            "-fflags", "flush_packets",
            "-flags", "low_delay",
            "-err_detect", "ignore_err",
            "-thread_queue_size", "4096",
            "-flush_packets", "1",
        )
}

export function ingestRtmp(port?: number) {
    const _port = port ?? randomInclusive(40000, 50000);
    const host = `rtmp://localhost:${_port}`;
    const output = new PassThrough();
    const command = ffmpeg(host);
    addLowLatencyFlags(command);
    command
        .inputFormat("flv")
        .addInputOption(
            "-listen", "1",
            "-tcp_nodelay", "1"
        )
        .output(output)
        .outputFormat("matroska");

    command.addOutputOption("-map 0:v");
    command.videoCodec("copy");
    command
        .addOutputOption("-map 0:a?")
        .audioChannels(2)
        .audioFrequency(48000)
        .audioCodec("libopus")
        .audioBitrate("128k");
    
    command.run();
    return { command, output, host }
}

export function ingestSrt(port?: number) {
    const _port = port ?? randomInclusive(40000, 50000);
    const host = `srt://localhost:${_port}?transtype=live&smoother=live`;
    const output = new PassThrough();
    const command = ffmpeg(host);
    addLowLatencyFlags(command);
    command
        .inputFormat("mpegts")
        .addInputOption(
            "-mode", "listener",
            "-latency", "5000", // 5000 microseconds
            "-scan_all_pmts", "0"
        )
        .output(output)
        .outputFormat("matroska");

    command.addOutputOption("-map 0:v");
    command.videoCodec("copy");
    command
        .addOutputOption("-map 0:a?")
        .audioChannels(2)
        .audioFrequency(48000)
        .audioCodec("libopus")
        .audioBitrate("128k");
    
    command.run();
    return { command, output, host }
}

export function ingestRist(port?: number) {
    const _port = port ?? randomInclusive(40000, 50000);
    const hostListener = `rist://@localhost:${_port}`;
    const host = `rist://localhost:${_port}`
    const output = new PassThrough();
    const command = ffmpeg(hostListener);
    addLowLatencyFlags(command);
    command
        .inputFormat("mpegts")
        .addInputOption(
            "-buffer_size", "20",
            "-scan_all_pmts", "0"
        )
        .output(output)
        .outputFormat("matroska");

    command.addOutputOption("-map 0:v");
    command.videoCodec("copy");
    command
        .addOutputOption("-map 0:a?")
        .audioChannels(2)
        .audioFrequency(48000)
        .audioCodec("libopus")
        .audioBitrate("128k");

    command.run();
    return { command, output, host }
}
