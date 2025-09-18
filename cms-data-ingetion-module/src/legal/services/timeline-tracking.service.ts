import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, sql, desc, asc, gte, lte } from 'drizzle-orm';
import * as schema from '../../db/schema';

export interface TimelineEvent {
  id: string;
  caseId: string;
  eventType: string;
  eventTitle: string;
  eventDescription: string;
  eventDate: Date;
  eventData?: any;
  createdBy: string;
  createdAt: Date;
  isMilestone: boolean;
  tags?: string[];
}

export interface CaseTimeline {
  caseId: string;
  caseCode: string;
  borrowerName: string;
  events: TimelineEvent[];
  milestones: TimelineEvent[];
  totalEvents: number;
  caseDuration: number; // Days since case creation
}

export interface TimelineStats {
  totalEvents: number;
  eventsByType: { eventType: string; count: number }[];
  averageEventsPerCase: number;
  milestoneCompletionRate: number;
}

@Injectable()
export class TimelineTrackingService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  /**
   * Add a timeline event to a case
   */
  async addTimelineEvent(eventData: {
    caseId: string;
    eventType: string;
    eventTitle: string;
    eventDescription: string;
    eventDate: Date;
    eventData?: any;
    createdBy: string;
    isMilestone?: boolean;
    tags?: string[];
  }): Promise<{ success: boolean; message: string; eventId?: string }> {
    try {
      // Verify case exists and is active
      const caseExists = await this.db
        .select({ id: schema.legalCases.id })
        .from(schema.legalCases)
        .where(
          and(eq(schema.legalCases.id, eventData.caseId), eq(schema.legalCases.status, 'Active')),
        )
        .limit(1);

      if (caseExists.length === 0) {
        return { success: false, message: 'Case not found' };
      }

      // Create timeline event
      const event = await this.db
        .insert(schema.caseTimelineEvents)
        .values({
          caseId: eventData.caseId,
          eventType: eventData.eventType,
          eventTitle: eventData.eventTitle,
          eventDescription: eventData.eventDescription,
          eventDate: eventData.eventDate,
          eventData: eventData.eventData ? JSON.stringify(eventData.eventData) : null,
          isMilestone: eventData.isMilestone || false,
          tags: eventData.tags || [],
          createdBy: eventData.createdBy,
        })
        .returning();

      return {
        success: true,
        message: 'Timeline event added successfully',
        eventId: event[0].id,
      };
    } catch (error) {
      console.error('Error adding timeline event:', error);
      return { success: false, message: 'Failed to add timeline event' };
    }
  }

  /**
   * Get complete timeline for a case
   */
  async getCaseTimeline(caseId: string): Promise<CaseTimeline | null> {
    try {
      // Get case details
      const caseDetails = await this.db
        .select({
          id: schema.legalCases.id,
          caseId: schema.legalCases.caseId,
          borrowerName: schema.legalCases.borrowerName,
          createdAt: schema.legalCases.createdAt,
        })
        .from(schema.legalCases)
        .where(and(eq(schema.legalCases.id, caseId), eq(schema.legalCases.status, 'Active')))
        .limit(1);

      if (caseDetails.length === 0) {
        return null;
      }

      const caseData = caseDetails[0];

      // Get all timeline events
      const events = await this.db
        .select()
        .from(schema.caseTimelineEvents)
        .where(eq(schema.caseTimelineEvents.caseId, caseId))
        .orderBy(asc(schema.caseTimelineEvents.eventDate));

      // Separate milestones from regular events
      const milestones = events.filter((event) => event.isMilestone);
      const regularEvents = events.filter((event) => !event.isMilestone);

      // Calculate case duration
      const caseDuration = Math.floor(
        (new Date().getTime() - new Date(caseData.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        caseId: caseData.id,
        caseCode: caseData.caseId,
        borrowerName: caseData.borrowerName,
        events: regularEvents,
        milestones,
        totalEvents: events.length,
        caseDuration,
      };
    } catch (error) {
      console.error('Error getting case timeline:', error);
      return null;
    }
  }

  /**
   * Get timeline events by type
   */
  async getTimelineEventsByType(eventType: string, caseId?: string): Promise<TimelineEvent[]> {
    let whereConditions = [eq(schema.caseTimelineEvents.eventType, eventType)];

    if (caseId) {
      whereConditions.push(eq(schema.caseTimelineEvents.caseId, caseId));
    }

    return await this.db
      .select()
      .from(schema.caseTimelineEvents)
      .where(and(...whereConditions))
      .orderBy(desc(schema.caseTimelineEvents.eventDate));
  }

  /**
   * Get milestone events for a case
   */
  async getCaseMilestones(caseId: string): Promise<TimelineEvent[]> {
    return await this.db
      .select()
      .from(schema.caseTimelineEvents)
      .where(
        and(
          eq(schema.caseTimelineEvents.caseId, caseId),
          eq(schema.caseTimelineEvents.isMilestone, true),
        ),
      )
      .orderBy(asc(schema.caseTimelineEvents.eventDate));
  }

  /**
   * Get upcoming events (next 30 days)
   */
  async getUpcomingEvents(days: number = 30): Promise<TimelineEvent[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.db
      .select()
      .from(schema.caseTimelineEvents)
      .where(
        and(
          gte(schema.caseTimelineEvents.eventDate, new Date()),
          lte(schema.caseTimelineEvents.eventDate, futureDate),
        ),
      )
      .orderBy(asc(schema.caseTimelineEvents.eventDate));
  }

  /**
   * Get overdue events
   */
  async getOverdueEvents(): Promise<TimelineEvent[]> {
    return await this.db
      .select()
      .from(schema.caseTimelineEvents)
      .where(
        and(
          lte(schema.caseTimelineEvents.eventDate, new Date()),
          eq(schema.caseTimelineEvents.isMilestone, true),
        ),
      )
      .orderBy(desc(schema.caseTimelineEvents.eventDate));
  }

  /**
   * Get timeline statistics
   */
  async getTimelineStats(): Promise<TimelineStats> {
    const stats = await this.db
      .select({
        totalEvents: sql<number>`count(*)`,
        eventsByType: sql<{ eventType: string; count: number }[]>`array_agg(DISTINCT event_type)`,
      })
      .from(schema.caseTimelineEvents);

    const eventTypeStats = await this.db
      .select({
        eventType: schema.caseTimelineEvents.eventType,
        count: sql<number>`count(*)`,
      })
      .from(schema.caseTimelineEvents)
      .groupBy(schema.caseTimelineEvents.eventType);

    const milestoneStats = await this.db
      .select({
        totalMilestones: sql<number>`count(case when is_milestone = true then 1 end)`,
        completedMilestones: sql<number>`count(case when is_milestone = true and event_date <= NOW() then 1 end)`,
      })
      .from(schema.caseTimelineEvents);

    const caseCount = await this.db
      .select({ count: sql<number>`count(distinct case_id)` })
      .from(schema.caseTimelineEvents);

    const milestoneCompletionRate =
      milestoneStats[0].totalMilestones > 0
        ? (milestoneStats[0].completedMilestones / milestoneStats[0].totalMilestones) * 100
        : 0;

    return {
      totalEvents: stats[0].totalEvents,
      eventsByType: eventTypeStats.map((stat) => ({
        eventType: stat.eventType,
        count: stat.count,
      })),
      averageEventsPerCase: caseCount[0].count > 0 ? stats[0].totalEvents / caseCount[0].count : 0,
      milestoneCompletionRate,
    };
  }

  /**
   * Create automatic timeline events based on case status changes
   */
  async createStatusChangeEvent(
    caseId: string,
    fromStatus: string,
    toStatus: string,
    changedBy: string,
    reason?: string,
  ): Promise<void> {
    const eventTitles = {
      Filed: 'Case Filed',
      'Under Trial': 'Trial Started',
      Stayed: 'Case Stayed',
      Dismissed: 'Case Dismissed',
      Resolved: 'Case Resolved',
      Closed: 'Case Closed',
    };

    const eventDescriptions = {
      Filed: 'Legal case has been filed in court',
      'Under Trial': 'Case proceedings have begun in court',
      Stayed: 'Case proceedings have been stayed',
      Dismissed: 'Case has been dismissed by the court',
      Resolved: 'Case has been resolved successfully',
      Closed: 'Case has been officially closed',
    };

    await this.addTimelineEvent({
      caseId,
      eventType: 'Status Change',
      eventTitle: eventTitles[toStatus] || `Status changed to ${toStatus}`,
      eventDescription:
        eventDescriptions[toStatus] || `Case status changed from ${fromStatus} to ${toStatus}`,
      eventDate: new Date(),
      createdBy: changedBy,
      isMilestone: ['Filed', 'Under Trial', 'Resolved', 'Closed'].includes(toStatus),
      tags: ['status-change', 'automatic'],
      eventData: {
        fromStatus,
        toStatus,
        reason,
      },
    });
  }

  /**
   * Create hearing timeline event
   */
  async createHearingEvent(
    caseId: string,
    hearingDate: Date,
    hearingType: string,
    createdBy: string,
    notes?: string,
  ): Promise<void> {
    await this.addTimelineEvent({
      caseId,
      eventType: 'Hearing',
      eventTitle: `${hearingType} Hearing Scheduled`,
      eventDescription: `Court hearing scheduled for ${hearingDate.toLocaleDateString()}`,
      eventDate: hearingDate,
      createdBy,
      isMilestone: true,
      tags: ['hearing', 'court'],
      eventData: {
        hearingType,
        notes,
      },
    });
  }

  /**
   * Create document timeline event
   */
  async createDocumentEvent(
    caseId: string,
    documentType: string,
    documentName: string,
    createdBy: string,
    documentId?: string,
  ): Promise<void> {
    await this.addTimelineEvent({
      caseId,
      eventType: 'Document',
      eventTitle: `${documentType} Document Added`,
      eventDescription: `Document "${documentName}" has been uploaded`,
      eventDate: new Date(),
      createdBy,
      isMilestone: ['Court Order', 'Judgment', 'Settlement Agreement'].includes(documentType),
      tags: ['document', 'upload'],
      eventData: {
        documentType,
        documentName,
        documentId,
      },
    });
  }

  /**
   * Create lawyer assignment timeline event
   */
  async createLawyerAssignmentEvent(
    caseId: string,
    lawyerName: string,
    assignedBy: string,
    assignmentType: 'assigned' | 'reassigned' = 'assigned',
  ): Promise<void> {
    await this.addTimelineEvent({
      caseId,
      eventType: 'Assignment',
      eventTitle: `Lawyer ${assignmentType === 'assigned' ? 'Assigned' : 'Reassigned'}`,
      eventDescription: `Lawyer ${lawyerName} has been ${assignmentType} to this case`,
      eventDate: new Date(),
      createdBy: assignedBy,
      isMilestone: assignmentType === 'assigned',
      tags: ['assignment', 'lawyer'],
      eventData: {
        lawyerName,
        assignmentType,
      },
    });
  }
}
