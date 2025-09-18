import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LawyerAssignmentService } from '../services/lawyer-assignment.service';
import { LawyerService } from '../services/lawyer.service';
import { NotificationService } from '../services/notification.service';
import { StatusManagementService } from '../services/status-management.service';
import { TimelineTrackingService } from '../services/timeline-tracking.service';
import { CreateLawyerDto } from '../dto/create-lawyer.dto';
import { UpdateLawyerDto } from '../dto/update-lawyer.dto';
import { LawyerResponseDto, LawyerListResponseDto } from '../dto/lawyer-response.dto';
import { AssignmentRequestDto } from '../dto/assignment-request.dto';
import { StatusUpdateDto } from '../dto/status-update.dto';

@ApiTags('Lawyer Management & Case Assignment')
@ApiBearerAuth()
@Controller('legal/lawyers')
export class LawyerManagementController {
  constructor(
    private readonly lawyerAssignmentService: LawyerAssignmentService,
    private readonly lawyerService: LawyerService,
    private readonly notificationService: NotificationService,
    private readonly statusManagementService: StatusManagementService,
    private readonly timelineTrackingService: TimelineTrackingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new lawyer' })
  @ApiBody({ type: CreateLawyerDto })
  @ApiResponse({
    status: 201,
    description: 'Lawyer created successfully',
    type: LawyerResponseDto,
  })
  async createLawyer(
    @Body() createDto: CreateLawyerDto,
    @Request() req: any,
  ): Promise<LawyerResponseDto> {
    return this.lawyerService.createLawyer(createDto, req.user?.id || 'system');
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all lawyers with workload information' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, email, or bar number',
  })
  @ApiQuery({
    name: 'specialization',
    required: false,
    type: String,
    description: 'Filter by specialization',
  })
  @ApiQuery({
    name: 'isAvailable',
    required: false,
    type: Boolean,
    description: 'Filter by availability',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'lawyerType',
    required: false,
    type: String,
    description: 'Filter by lawyer type (Internal/External)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lawyers retrieved successfully',
    type: LawyerListResponseDto,
  })
  async getLawyers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('specialization') specialization?: string,
    @Query('isAvailable') isAvailable?: boolean,
    @Query('isActive') isActive?: boolean,
    @Query('lawyerType') lawyerType?: string,
  ): Promise<LawyerListResponseDto> {
    return this.lawyerService.getLawyers(
      page,
      limit,
      search,
      specialization,
      isAvailable,
      isActive,
      lawyerType,
    );
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available lawyers for case assignment' })
  @ApiQuery({
    name: 'specialization',
    required: false,
    type: String,
    description: 'Filter by specialization',
  })
  @ApiQuery({
    name: 'jurisdiction',
    required: false,
    type: String,
    description: 'Filter by jurisdiction',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of lawyers to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Available lawyers retrieved successfully',
    type: [LawyerResponseDto],
  })
  async getAvailableLawyers(
    @Query('specialization') specialization?: string,
    @Query('jurisdiction') jurisdiction?: string,
    @Query('limit') limit?: number,
  ): Promise<LawyerResponseDto[]> {
    return this.lawyerService.getAvailableLawyers(specialization, jurisdiction, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lawyer by ID' })
  @ApiParam({ name: 'id', description: 'Lawyer ID' })
  @ApiResponse({
    status: 200,
    description: 'Lawyer retrieved successfully',
    type: LawyerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Lawyer not found',
  })
  async getLawyerById(@Param('id') id: string): Promise<LawyerResponseDto> {
    return this.lawyerService.getLawyerById(id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get lawyer by email' })
  @ApiParam({ name: 'email', description: 'Lawyer email' })
  @ApiResponse({
    status: 200,
    description: 'Lawyer retrieved successfully',
    type: LawyerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Lawyer not found',
  })
  async getLawyerByEmail(@Param('email') email: string): Promise<LawyerResponseDto> {
    return this.lawyerService.getLawyerByEmail(email);
  }

  @Get(':id/workload')
  @ApiOperation({ summary: 'Get lawyer workload statistics' })
  @ApiParam({ name: 'id', description: 'Lawyer ID' })
  @ApiResponse({
    status: 200,
    description: 'Workload statistics retrieved successfully',
  })
  async getLawyerWorkloadStats(@Param('id') id: string) {
    return this.lawyerService.getLawyerWorkloadStats(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lawyer information' })
  @ApiParam({ name: 'id', description: 'Lawyer ID' })
  @ApiBody({ type: UpdateLawyerDto })
  @ApiResponse({
    status: 200,
    description: 'Lawyer updated successfully',
    type: LawyerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Lawyer not found',
  })
  async updateLawyer(
    @Param('id') id: string,
    @Body() updateDto: UpdateLawyerDto,
    @Request() req: any,
  ): Promise<LawyerResponseDto> {
    return this.lawyerService.updateLawyer(id, updateDto, req.user?.id || 'system');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete lawyer (soft delete)' })
  @ApiParam({ name: 'id', description: 'Lawyer ID' })
  @ApiResponse({
    status: 200,
    description: 'Lawyer deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lawyer not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete lawyer with active cases',
  })
  async deleteLawyer(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    return this.lawyerService.deleteLawyer(id, req.user?.id || 'system');
  }

  @Get('workload')
  @ApiOperation({ summary: 'Get lawyer workload statistics' })
  @ApiResponse({
    status: 200,
    description: 'Workload statistics retrieved successfully',
  })
  async getWorkloadStats() {
    return await this.lawyerAssignmentService.getLawyerWorkloadStats();
  }

  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign lawyer to case with workload balancing' })
  @ApiBody({ type: AssignmentRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Lawyer assigned successfully',
  })
  async assignLawyerToCase(@Body() assignmentDto: AssignmentRequestDto, @Request() req: any) {
    const { caseId, caseType, jurisdiction, specialization, priority } = assignmentDto;
    const assignedBy = req.user?.username || 'system';

    // Find best lawyer for the case
    const assignmentResult = await this.lawyerAssignmentService.findBestLawyerForCase({
      caseType,
      jurisdiction,
      specialization,
      priority,
    });

    if (!assignmentResult.assignedLawyer) {
      return {
        success: false,
        message: assignmentResult.assignmentReason,
        alternatives: assignmentResult.alternatives,
      };
    }

    // Assign the lawyer
    const assignResult = await this.lawyerAssignmentService.assignLawyerToCase(
      caseId,
      assignmentResult.assignedLawyer.lawyerId,
      assignedBy,
      assignmentResult.assignmentReason,
    );

    if (assignResult.success) {
      // Send notification to assigned lawyer
      await this.notificationService.notifyLawyerAssignment(
        assignmentResult.assignedLawyer.lawyerId,
        caseId,
        'LC-20250721-0001', // This should come from the case
        'Borrower Name', // This should come from the case
      );

      // Create timeline event
      await this.timelineTrackingService.createLawyerAssignmentEvent(
        caseId,
        assignmentResult.assignedLawyer.fullName,
        assignedBy,
        'assigned',
      );
    }

    return assignResult;
  }

  @Put(':lawyerId/reassign/:caseId')
  @ApiOperation({ summary: 'Reassign case to different lawyer' })
  @ApiParam({ name: 'lawyerId', description: 'New lawyer ID' })
  @ApiParam({ name: 'caseId', description: 'Case ID to reassign' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string' } } } })
  @ApiResponse({
    status: 200,
    description: 'Case reassigned successfully',
  })
  async reassignCase(
    @Param('lawyerId') lawyerId: string,
    @Param('caseId') caseId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    const reassignedBy = req.user?.username || 'system';

    const result = await this.lawyerAssignmentService.reassignCase(
      caseId,
      lawyerId,
      reassignedBy,
      body.reason,
    );

    if (result.success) {
      // Send notification
      await this.notificationService.notifyCaseReassignment(
        lawyerId,
        caseId,
        'LC-20250721-0001', // This should come from the case
        body.reason,
      );

      // Create timeline event
      await this.timelineTrackingService.createLawyerAssignmentEvent(
        caseId,
        'New Lawyer Name', // This should come from the lawyer data
        reassignedBy,
        'reassigned',
      );
    }

    return result;
  }

  @Get(':lawyerId/assignments')
  @ApiOperation({ summary: 'Get case assignments for a lawyer' })
  @ApiParam({ name: 'lawyerId', description: 'Lawyer ID' })
  @ApiResponse({
    status: 200,
    description: 'Assignments retrieved successfully',
  })
  async getLawyerAssignments(@Param('lawyerId') lawyerId: string) {
    return await this.lawyerAssignmentService.getLawyerAssignments(lawyerId);
  }

  @Put('cases/:caseId/status')
  @ApiOperation({ summary: 'Update case status with workflow validation' })
  @ApiParam({ name: 'caseId', description: 'Case ID' })
  @ApiBody({ type: StatusUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Case status updated successfully',
  })
  async updateCaseStatus(
    @Param('caseId') caseId: string,
    @Body() statusDto: StatusUpdateDto,
    @Request() req: any,
  ) {
    const updatedBy = req.user?.username || 'system';

    const result = await this.statusManagementService.updateCaseStatus({
      caseId,
      newStatus: statusDto.newStatus,
      updatedBy,
      reason: statusDto.reason,
      nextHearingDate: statusDto.nextHearingDate,
      lastHearingOutcome: statusDto.lastHearingOutcome,
      caseClosureDate: statusDto.caseClosureDate,
      outcomeSummary: statusDto.outcomeSummary,
    });

    if (result.success) {
      // Create timeline event for status change
      await this.timelineTrackingService.createStatusChangeEvent(
        caseId,
        'Previous Status', // This should come from the case
        statusDto.newStatus,
        updatedBy,
        statusDto.reason,
      );

      // Send notifications to relevant parties
      await this.notificationService.notifyStatusChange(
        caseId,
        'LC-20250721-0001', // This should come from the case
        statusDto.newStatus,
        ['lawyer-id-1', 'lawyer-id-2'], // This should come from case assignments
        'lawyer',
      );
    }

    return result;
  }

  @Get('cases/:caseId/timeline')
  @ApiOperation({ summary: 'Get case timeline with events and milestones' })
  @ApiParam({ name: 'caseId', description: 'Case ID' })
  @ApiResponse({
    status: 200,
    description: 'Case timeline retrieved successfully',
  })
  async getCaseTimeline(@Param('caseId') caseId: string) {
    return await this.timelineTrackingService.getCaseTimeline(caseId);
  }

  @Get('cases/attention')
  @ApiOperation({ summary: 'Get cases requiring attention' })
  @ApiResponse({
    status: 200,
    description: 'Cases requiring attention retrieved successfully',
  })
  async getCasesRequiringAttention() {
    return await this.statusManagementService.getCasesRequiringAttention();
  }

  @Get('notifications/:recipientId')
  @ApiOperation({ summary: 'Get notifications for a recipient' })
  @ApiParam({ name: 'recipientId', description: 'Recipient ID' })
  @ApiQuery({ name: 'recipientType', required: true, type: String, description: 'Recipient type' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async getNotifications(
    @Param('recipientId') recipientId: string,
    @Query('recipientType') recipientType: 'lawyer' | 'admin' | 'user',
    @Query('limit') limit?: number,
  ) {
    return await this.notificationService.getNotifications(recipientId, recipientType, limit || 50);
  }

  @Put('notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  async markNotificationAsRead(@Param('notificationId') notificationId: string) {
    return await this.notificationService.markAsRead(notificationId);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get comprehensive system statistics' })
  @ApiResponse({
    status: 200,
    description: 'System statistics retrieved successfully',
  })
  async getSystemStats() {
    const [workloadStats, statusStats, timelineStats, notificationStats] = await Promise.all([
      this.lawyerAssignmentService.getLawyerWorkloadStats(),
      this.statusManagementService.getCasesByStatus(),
      this.timelineTrackingService.getTimelineStats(),
      this.notificationService.getNotificationStats(),
    ]);

    return {
      workload: workloadStats,
      caseStatus: statusStats,
      timeline: timelineStats,
      notifications: notificationStats,
    };
  }
}
