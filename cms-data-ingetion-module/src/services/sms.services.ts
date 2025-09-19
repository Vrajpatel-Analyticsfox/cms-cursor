import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendSms(mobileNumbers: string, message: string): Promise<any> {
    try {
      const response = await axios.post(
        'http://192.168.29.247:82/sms-api/send-sms',
        {
          senderId: 'WEBSMS',
          is_Unicode: false,
          is_Flash: false,
          dataCoding: 0,
          message,
          mobileNumbers,
          apiKey: '2JKeA8j8+UubSvG+PO8VQDZ4S3yITKMjzEIoKSUEqlg=',
          clientId: '14fd5fae-773d-4b38-8a02-bda453f885a3',
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`✅ SMS sent to ${mobileNumbers}`);
      return response.data;
    } catch (error) {
      this.logger.error('❌ SMS API Error:', error.message);
      throw error;
    }
  }
}
