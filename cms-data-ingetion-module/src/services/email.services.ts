import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

@Injectable()
export class EMailService {
  private readonly logger = new Logger(EMailService.name);
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.rediffmailpro.com', // e.g., smtp.gmail.com
      name: 'thecollectpro.co.in',
      port: 587,
      secure: false, // true if using port 465
      auth: {
        user: 'cms@thecollectpro.co.in',
        pass: 'CollectPro@2025',
      },
    });
  }

  async sendAutoSchedulePDF(to: string, refNo, attachments) {
    const mailOptions = {
      from: 'cms@thecollectpro.co.in',
      to: to, // comma separated emails
      subject: `Legal Notice - ${refNo}`,
      html: `<p>Dear Customer,</p><p>Please find attached your legal notice.</p>`,
      text: 'Please find attached the invalid data CSV file.',
      attachments: attachments,
    };

    try {
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log('Message sent', info);
      });

      // this.logger.log(`Invalid data CSV sent to ${process.env.REPORT_RECEIVER}`);
    } catch (err) {
      this.logger.error('Error sending email with CSV:', err);
      throw err;
    }
  }

  async sendInvalidDataReport(csv: string, fileName: string, dateStr: string) {
    const mailOptions = {
      from: 'cms@thecollectpro.co.in',
      to: 'mayank@analyticsfoxsoftwares.com', // comma separated emails
      subject: `Invalid Data Report - ${dateStr}`,
      text: 'Please find attached the invalid data CSV file.',
      attachments: [
        {
          filename: fileName,
          content: csv,
        },
      ],
    };

    try {
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log('Message sent', info);
      });

      // this.logger.log(`Invalid data CSV sent to ${process.env.REPORT_RECEIVER}`);
    } catch (err) {
      this.logger.error('Error sending email with CSV:', err);
      throw err;
    }
  }
}
