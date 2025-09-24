import { Injectable, Logger } from '@nestjs/common';
import { EMailService } from '../../../services/email.services';
import { SmsService } from '../../../services/sms.services';
import { ErrorLog } from '../error-handling.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EMailService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Send notifications based on error type and severity
   */
  async sendErrorNotification(errorLog: ErrorLog): Promise<void> {
    try {
      // Determine notification channels based on severity
      const notificationChannels = this.getNotificationChannels(errorLog.severity);

      // Send notifications through each channel
      const notificationPromises = notificationChannels.map((channel) =>
        this.sendNotificationByChannel(channel, errorLog),
      );

      await Promise.allSettled(notificationPromises);

      this.logger.log(`Notifications sent for error ${errorLog.errorId}`);
    } catch (error) {
      this.logger.error(`Failed to send notifications for error ${errorLog.errorId}:`, error);
    }
  }

  /**
   * Determine notification channels based on severity
   */
  private getNotificationChannels(severity: string): string[] {
    const channelMapping = {
      Critical: ['Email', 'SMS', 'InApp'],
      Error: ['Email', 'InApp'],
      Warning: ['InApp'],
      Info: ['InApp'],
    };

    return channelMapping[severity] || ['InApp'];
  }

  /**
   * Send notification through specific channel
   */
  private async sendNotificationByChannel(channel: string, errorLog: ErrorLog): Promise<void> {
    const message = this.buildNotificationMessage(errorLog);
    const recipients = this.getRecipients(errorLog.severity, errorLog.source);

    switch (channel) {
      case 'Email':
        await this.sendEmailNotification(recipients, message, errorLog);
        break;
      case 'SMS':
        await this.sendSmsNotification(recipients, message, errorLog);
        break;
      case 'InApp':
        await this.sendInAppNotification(recipients, message, errorLog);
        break;
    }
  }

  /**
   * Send Email Notification
   */
  private async sendEmailNotification(
    recipients: string[],
    message: string,
    errorLog: ErrorLog,
  ): Promise<void> {
    const emailTemplate = this.getEmailTemplate(errorLog.severity);
    const emailContent = this.renderEmailTemplate(emailTemplate, errorLog, message);

    for (const recipient of recipients) {
      try {
        await this.emailService.sendAutoSchedulePDF(recipient, `Error: ${errorLog.errorCode}`, [
          {
            filename: 'error-details.html',
            content: emailContent,
            contentType: 'text/html',
          },
        ]);
        this.logger.log(`Email notification sent to ${recipient} for error ${errorLog.errorId}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${recipient}:`, error);
      }
    }
  }

  /**
   * Send SMS Notification
   */
  private async sendSmsNotification(
    recipients: string[],
    message: string,
    errorLog: ErrorLog,
  ): Promise<void> {
    const smsMessage = this.buildSmsMessage(errorLog, message);

    for (const recipient of recipients) {
      try {
        const smsResult = await this.smsService.sendSms(recipient, smsMessage);
        if (smsResult.success) {
          this.logger.log(`SMS notification sent to ${recipient} for error ${errorLog.errorId}`);
        } else {
          this.logger.error(`SMS failed to ${recipient}: ${smsResult.errorDescription}`);
        }
      } catch (error) {
        this.logger.error(`Failed to send SMS to ${recipient}:`, error);
      }
    }
  }

  /**
   * Send In-App Notification
   */
  private async sendInAppNotification(
    recipients: string[],
    message: string,
    errorLog: ErrorLog,
  ): Promise<void> {
    // Store in-app notification in database or push to real-time system
    // This would typically integrate with a real-time notification system
    this.logger.log(`In-app notification sent to ${recipients.join(', ')}: ${message}`);

    // For now, just log the notification
    // In a real implementation, this would:
    // 1. Store notification in database
    // 2. Push to WebSocket clients
    // 3. Update notification dashboard
  }

  /**
   * Build notification message based on error details
   */
  private buildNotificationMessage(errorLog: ErrorLog): string {
    const timestamp = new Date(errorLog.timestamp).toLocaleString();

    return `
Error Details:
- Source: ${errorLog.source}
- Type: ${errorLog.errorType}
- Code: ${errorLog.errorCode}
- Message: ${errorLog.errorMessage}
- Severity: ${errorLog.severity}
- Time: ${timestamp}
- Entity: ${errorLog.entityAffected || 'N/A'}
- Retriable: ${errorLog.retriable ? 'Yes' : 'No'}

${errorLog.rootCauseSummary ? `Root Cause: ${errorLog.rootCauseSummary}` : ''}
    `.trim();
  }

  /**
   * Build SMS message (shorter format)
   */
  private buildSmsMessage(errorLog: ErrorLog, message: string): string {
    return `[${errorLog.severity}] ${errorLog.source}: ${errorLog.errorCode} - ${errorLog.errorMessage}`;
  }

  /**
   * Get recipients based on severity and source
   */
  private getRecipients(severity: string, source: string): string[] {
    const recipientMapping = {
      Critical: ['admin@company.com', 'tech-support@company.com'],
      Error: ['admin@company.com'],
      Warning: ['admin@company.com'],
      Info: ['admin@company.com'],
    };

    return recipientMapping[severity] || ['admin@company.com'];
  }

  /**
   * Get email template based on severity
   */
  private getEmailTemplate(severity: string): string {
    const templates = {
      Critical: 'critical-error-template.html',
      Error: 'error-template.html',
      Warning: 'warning-template.html',
      Info: 'info-template.html',
    };

    return templates[severity] || 'default-template.html';
  }

  /**
   * Render email template with error data
   */
  private renderEmailTemplate(template: string, errorLog: ErrorLog, message: string): string {
    // Simple template rendering - in production, use a proper templating engine
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${this.getSeverityColor(errorLog.severity)}; border-bottom: 2px solid ${this.getSeverityColor(errorLog.severity)}; padding-bottom: 10px;">
          ${this.getSeverityIcon(errorLog.severity)} Error Notification
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Error Summary</h3>
          <p><strong>Severity:</strong> <span style="color: ${this.getSeverityColor(errorLog.severity)}; font-weight: bold;">${errorLog.severity}</span></p>
          <p><strong>Source:</strong> ${errorLog.source}</p>
          <p><strong>Error Code:</strong> <code style="background-color: #e9ecef; padding: 2px 4px; border-radius: 3px;">${errorLog.errorCode}</code></p>
          <p><strong>Message:</strong> ${errorLog.errorMessage}</p>
          <p><strong>Timestamp:</strong> ${new Date(errorLog.timestamp).toLocaleString()}</p>
          <p><strong>Entity Affected:</strong> ${errorLog.entityAffected || 'N/A'}</p>
          <p><strong>Retriable:</strong> ${errorLog.retriable ? 'Yes' : 'No'}</p>
        </div>

        ${
          errorLog.rootCauseSummary
            ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="margin-top: 0; color: #856404;">Root Cause Analysis</h4>
            <p style="color: #856404;">${errorLog.rootCauseSummary}</p>
          </div>
        `
            : ''
        }

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Full Error Details</h4>
          <pre style="background-color: #e9ecef; padding: 10px; border-radius: 3px; overflow-x: auto; font-size: 12px;">${message}</pre>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
          <p>This is an automated error notification from the CMS system.</p>
          <p>Error ID: ${errorLog.errorId}</p>
        </div>
      </div>
    `;
  }

  /**
   * Get severity color for email styling
   */
  private getSeverityColor(severity: string): string {
    const colors = {
      Critical: '#dc3545',
      Error: '#fd7e14',
      Warning: '#ffc107',
      Info: '#17a2b8',
    };

    return colors[severity] || '#6c757d';
  }

  /**
   * Get severity icon for email styling
   */
  private getSeverityIcon(severity: string): string {
    const icons = {
      Critical: '🚨',
      Error: '❌',
      Warning: '⚠️',
      Info: 'ℹ️',
    };

    return icons[severity] || '📋';
  }
}
