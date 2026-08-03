const fs = require('fs');
const path = require('path');
const http = require('http');
const config = require('../config/env');
const logger = require('../utils/logger');

class RealESRGANService {
  /**
   * Process image using Python FastAPI Real-ESRGAN REST Service or Fallback Engine with progress reporting
   *
   * @param {Object} params
   * @param {string} params.inputPath - Path to original image
   * @param {number} params.scale - Upscale factor (default 4)
   * @param {Function} params.onProgress - Callback function for reporting progress percentage
   * @returns {Promise<string>} Output file path
   */
  static async processImage({ inputPath, scale = 4, onProgress }) {
    const absoluteInputPath = path.resolve(inputPath);
    if (!fs.existsSync(absoluteInputPath)) {
      throw new Error(`Input image file not found at path: ${absoluteInputPath}`);
    }

    const filename = path.basename(absoluteInputPath);
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);
    const outputFilename = `upscaled-${scale}x-${nameWithoutExt}${ext}`;
    
    // Output directory resolving
    const outputDir = path.resolve(config.storage.outputDir);
    const outputPath = path.join(outputDir, outputFilename);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (onProgress) await onProgress(10);
    logger.info(`[Worker] Starting Real-ESRGAN ${scale}x upscaling for file: ${filename}`);

    let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/upscale';
    aiServiceUrl = aiServiceUrl.replace('localhost', '127.0.0.1');

    // Step 1: Send REST API HTTP request to Python FastAPI AI Service (Real-ESRGAN loaded in memory)
    try {
      if (onProgress) await onProgress(30);
      logger.info(`[Worker] Dispatching HTTP request to Python FastAPI AI Service (${aiServiceUrl})...`);

      const result = await this.callPythonAIService(aiServiceUrl, {
        input_path: absoluteInputPath,
        output_path: outputPath,
        scale: Number(scale),
        model_name: 'realesrgan-x4plus',
      });

      if (onProgress) await onProgress(90);
      logger.info(`[Worker] Python FastAPI AI Service returned success in ${result.execution_time_ms}ms`);

      if (onProgress) await onProgress(100);
      return outputPath;
    } catch (err) {
      logger.error(`[Worker] Python AI Service request failed (${err.message}).`);
      throw new Error(`Real-ESRGAN upscaling failed: ${err.message}`);
    }
  }

  /**
   * Helper function to issue HTTP POST request to Python FastAPI service
   */
  static callPythonAIService(serviceUrl, payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(serviceUrl);
      const postData = JSON.stringify(payload);

      const options = {
        hostname: url.hostname,
        port: url.port || 8000,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 600000, // 10 min timeout for CPU Real-ESRGAN upscaling
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error('Invalid JSON from AI Service'));
            }
          } else {
            reject(new Error(`AI Service HTTP ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('AI Service request timed out'));
      });

      req.write(postData);
      req.end();
    });
  }
}

module.exports = RealESRGANService;
