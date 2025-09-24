import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { db } from '../../../db/drizzle.config';
import { errorLogs } from '../../../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { NotificationService } from './notification.service';
import { EMailService } from '../../../services/email.services';
import { SmsService } from '../../../services/sms.services';
import { ErrorLog } from '../error-handling.service';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly emailService: EMailService,
    private readonly smsService: SmsService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  /**
   * Check and trigger escalation for critical errors
   */
  async checkEscalation(errorLog: ErrorLog): Promise<void> {
    // Only escalate Critical and Error severity
    if (!['Critical', 'Error'].includes(errorLog.severity)) {
      return;
    }

    // Check if escalation is needed based on SLA rules
    const shouldEscalate = await this.shouldEscalate(errorLog);

    if (shouldEscalate) {
      await this.triggerEscalation(errorLog);
    }
  }

  /**
   * Determine if escalation is needed based on SLA rules
   */
  private async shouldEscalate(errorLog: ErrorLog): Promise<boolean> {
    const escalationRules = {
      Critical: {
        maxResolutionTime: 30, // 30 minutes
        escalationDelay: 15, // Escalate after 15 minutes
      },
      Error: {
        maxResolutionTime: 120, // 2 hours
        escalationDelay: 60, // Escalate after 1 hour
      },
    };

    const rule = escalationRules[errorLog.severity];
    if (!rule) return false;

    // Check if error is unresolved and time threshold exceeded
    if (errorLog.resolved) return false;

    const timeSinceError = Date.now() - new Date(errorLog.timestamp).getTime();
    const escalationThreshold = rule.escalationDelay * 60 * 1000; // Convert to milliseconds

    return timeSinceError > escalationThreshold;
  }

  /**
   * Trigger escalation process
   */
  private async triggerEscalation(errorLog: ErrorLog): Promise<void> {
    this.logger.warn(`Escalating error ${errorLog.errorId} - ${errorLog.severity} severity`);

    // Send escalation notification
    await this.sendEscalationNotification(errorLog);

    // Schedule follow-up escalation if still unresolved
    await this.scheduleFollowUpEscalation(errorLog);
  }

  /**
   * Send escalation notification
   */
  private async sendEscalationNotification(errorLog: ErrorLog): Promise<void> {
    const escalationMessage = this.buildEscalationMessage(errorLog);
    const escalationRecipients = this.getEscalationRecipients(errorLog.severity);

    // Send to escalation recipients
    for (const recipient of escalationRecipients) {
      try {
        await this.emailService.sendAutoSchedulePDF(
          recipient,
          `ESCALATION: ${errorLog.errorCode}`,
          [
            {
              filename: 'escalation-details.html',
              content: escalationMessage,
              contentType: 'text/html',
            },
          ],
        );
        this.logger.log(`Escalation email sent to ${recipient} for error ${errorLog.errorId}`);
      } catch (error) {
        this.logger.error(`Failed to send escalation email to ${recipient}:`, error);
      }
    }

    // Also send SMS for Critical errors
    if (errorLog.severity === 'Critical') {
      const smsMessage = `ESCALATION: ${errorLog.source} - ${errorLog.errorCode} - ${errorLog.errorMessage}`;
      for (const recipient of escalationRecipients) {
        try {
          const smsResult = await this.smsService.sendSms(recipient, smsMessage);
          if (smsResult.success) {
            this.logger.log(`Escalation SMS sent to ${recipient} for error ${errorLog.errorId}`);
          } else {
            this.logger.error(
              `Escalation SMS failed to ${recipient}: ${smsResult.errorDescription}`,
            );
          }
        } catch (error) {
          this.logger.error(`Failed to send escalation SMS to ${recipient}:`, error);
        }
      }
    }
  }

  /**
   * Build escalation message
   */
  private buildEscalationMessage(errorLog: ErrorLog): string {
    const timeSinceError = this.getTimeSinceError(errorLog.timestamp);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545; border-bottom: 3px solid #dc3545; padding-bottom: 10px;">
          🚨 ERROR ESCALATION
        </h2>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <p style="margin: 0; color: #721c24; font-weight: bold;">
            This error has exceeded the SLA resolution time and requires immediate attention.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Error Details</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Error ID:</strong> ${errorLog.errorId}</li>
            <li style="margin: 8px 0;"><strong>Source:</strong> ${errorLog.source}</li>
            <li style="margin: 8px 0;"><strong>Type:</strong> ${errorLog.errorType}</li>
            <li style="margin: 8px 0;"><strong>Code:</strong> <code style="background-color: #e9ecef; padding: 2px 4px; border-radius: 3px;">${errorLog.errorCode}</code></li>
            <li style="margin: 8px 0;"><strong>Severity:</strong> <span style="color: #dc3545; font-weight: bold;">${errorLog.severity}</span></li>
            <li style="margin: 8px 0;"><strong>Message:</strong> ${errorLog.errorMessage}</li>
            <li style="margin: 8px 0;"><strong>Time Since Error:</strong> <span style="color: #dc3545; font-weight: bold;">${timeSinceError}</span></li>
            <li style="margin: 8px 0;"><strong>Entity Affected:</strong> ${errorLog.entityAffected || 'N/A'}</li>
            <li style="margin: 8px 0;"><strong>Retriable:</strong> ${errorLog.retriable ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        ${
          errorLog.rootCauseSummary
            ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="margin-top: 0; color: #856404;">Root Cause Analysis</h4>
            <p style="color: #856404; margin: 0;">${errorLog.rootCauseSummary}</p>
          </div>
        `
            : ''
        }
        
        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
          <h4 style="margin-top: 0; color: #0c5460;">Action Required</h4>
          <p style="color: #0c5460; margin: 0; font-weight: bold;">
            Please investigate and resolve this error immediately.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
          <p style="margin: 0;">This is an automated escalation notification from the CMS system.</p>
          <p style="margin: 5px 0 0 0;">Error ID: ${errorLog.errorId}</p>
          <p style="margin: 5px 0 0 0;">Escalated at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
  }

  /**
   * Get escalation recipients based on severity
   */
  private getEscalationRecipients(severity: string): string[] {
    const escalationMapping = {
      Critical: [
        'admin@company.com',
        'tech-lead@company.com',
        'on-call@company.com',
        'manager@company.com',
      ],
      Error: ['admin@company.com', 'tech-lead@company.com'],
    };

    return escalationMapping[severity] || ['admin@company.com'];
  }

  /**
   * Schedule follow-up escalation
   */
  private async scheduleFollowUpEscalation(errorLog: ErrorLog): Promise<void> {
    const followUpDelay = errorLog.severity === 'Critical' ? 30 : 60; // minutes

    const jobName = `escalation-followup-${errorLog.errorId}`;

    // Schedule follow-up check
    const timeout = setTimeout(
      async () => {
        await this.checkFollowUpEscalation(errorLog);
      },
      followUpDelay * 60 * 1000,
    );

    this.scheduler.addTimeout(jobName, timeout);
  }

  /**
   * Check if follow-up escalation is needed
   */
  private async checkFollowUpEscalation(errorLog: ErrorLog): Promise<void> {
    try {
      // Check if error is still unresolved
      const currentError = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.id, errorLog.id))
        .limit(1);

      if (currentError.length > 0 && !currentError[0].resolved) {
        // Convert database result to ErrorLog interface
        const errorLogForEscalation: ErrorLog = {
          ...currentError[0],
          rootCauseSummary: currentError[0].rootCauseSummary || undefined,
          stackTrace: currentError[0].stackTrace || undefined,
          entityAffected: currentError[0].entityAffected || undefined,
          resolutionNotes: currentError[0].resolutionNotes || undefined,
          resolvedBy: currentError[0].resolvedBy || undefined,
          resolvedAt: currentError[0].resolvedAt || undefined,
          createdAt: currentError[0].createdAt || new Date(),
          updatedAt: currentError[0].updatedAt || new Date(),
        };

        // Send follow-up escalation
        await this.sendFollowUpEscalation(errorLogForEscalation);
      }
    } catch (error) {
      this.logger.error(`Error checking follow-up escalation for ${errorLog.errorId}:`, error);
    }
  }

  /**
   * Send follow-up escalation
   */
  private async sendFollowUpEscalation(errorLog: ErrorLog): Promise<void> {
    const followUpMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545; border-bottom: 3px solid #dc3545; padding-bottom: 10px;">
          ⚠️ FOLLOW-UP ESCALATION
        </h2>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <p style="margin: 0; color: #721c24; font-weight: bold;">
            This error is still unresolved and requires immediate attention.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Error Details</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Error ID:</strong> ${errorLog.errorId}</li>
            <li style="margin: 8px 0;"><strong>Source:</strong> ${errorLog.source}</li>
            <li style="margin: 8px 0;"><strong>Severity:</strong> <span style="color: #dc3545; font-weight: bold;">${errorLog.severity}</span></li>
            <li style="margin: 8px 0;"><strong>Time Since Error:</strong> <span style="color: #dc3545; font-weight: bold;">${this.getTimeSinceError(errorLog.timestamp)}</span></li>
            <li style="margin: 8px 0;"><strong>Message:</strong> ${errorLog.errorMessage}</li>
          </ul>
        </div>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h4 style="margin-top: 0; color: #721c24;">URGENT ACTION REQUIRED</h4>
          <p style="color: #721c24; margin: 0; font-weight: bold;">
            This error has been escalated multiple times. Please resolve immediately.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
          <p style="margin: 0;">This is a follow-up escalation notification from the CMS system.</p>
          <p style="margin: 5px 0 0 0;">Error ID: ${errorLog.errorId}</p>
          <p style="margin: 5px 0 0 0;">Follow-up escalated at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    const recipients = this.getEscalationRecipients(errorLog.severity);

    for (const recipient of recipients) {
      try {
        await this.emailService.sendAutoSchedulePDF(
          recipient,
          `FOLLOW-UP ESCALATION: ${errorLog.errorCode}`,
          [
            {
              filename: 'followup-escalation-details.html',
              content: followUpMessage,
              contentType: 'text/html',
            },
          ],
        );
        this.logger.log(
          `Follow-up escalation email sent to ${recipient} for error ${errorLog.errorId}`,
        );
      } catch (error) {
        this.logger.error(`Failed to send follow-up escalation email to ${recipient}:`, error);
      }
    }
  }

  /**
   * Get time since error occurred
   */
  private getTimeSinceError(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day(s)`;
    if (diffHours > 0) return `${diffHours} hour(s)`;
    return `${diffMins} minute(s)`;
  }
}
