import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private client!: S3Client;
  private bucket!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const region = this.config.get<string>('S3_REGION') ?? 'us-east-1';
    this.bucket = this.config.get<string>('S3_BUCKET') ?? 'farm-media';
    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY') ?? 'minio',
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY') ?? 'minio12345',
      },
    });
  }

  async putBuffer(pathPrefix: string, buffer: Buffer, contentType: string) {
    const key = `${pathPrefix}/${randomUUID()}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      const publicBase = this.config.get<string>('S3_PUBLIC_BASE');
      const url = publicBase ? `${publicBase}/${this.bucket}/${key}` : `s3://${this.bucket}/${key}`;
      return { key, url };
    } catch (e) {
      this.logger.warn(`S3 upload failed, returning placeholder: ${e}`);
      return { key, url: `https://placehold.co/800x600?text=Farm+Media` };
    }
  }
}
