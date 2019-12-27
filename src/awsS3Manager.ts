import { S3 } from 'aws-sdk';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as uuidv1 from 'uuid/v1';

import { s3Config } from '@Config';
import { S3UploadOptions } from '@Types';

const s3 = new S3({ apiVersion: '2006-03-01' });
global.s3 = s3;

/**
 * @function uploadToS3
 * @description Upload file to AWS storage service.
 *
 * @param options One must provide a buffer of the file or the path to the file.
 * @returns The key to the uploaded file in S3.
 */
export async function uploadToS3(options: S3UploadOptions): Promise<string> {
  if (typeof s3Config === 'undefined') return;

  if (typeof options.file === 'undefined' && typeof options.path === 'undefined') {
    throw new Error('You must provide either a buffer of the file or the path to the file.');
  }

  if (options.deleteOriginalFile && typeof options.path === 'undefined') {
    throw new Error('To delete the original file afterwards, you must provide the path to the file');
  };

  const file = options.file || await fs.readFile(options.path);
  let key = options.key;
  if (typeof options.path !== 'undefined') key = key || path.basename(options.path);
  key = key || uuidv1();

  return new Promise((resolve, reject) => {
    s3.upload({
      Bucket: s3Config.bucket,
      Key: key,
      Body: file,
      StorageClass: 'INTELLIGENT_TIERING',
    }, async (err, data) => {
      if (err) return reject(err);
      if (options.deleteOriginalFile && typeof options.path !== 'undefined') {
        await fs.unlink(options.path);
      }
      resolve(data.Key);
    });
  });
}
