import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../../db/drizzle.config';
import { eq, and, desc, like, count, sql, asc } from 'drizzle-orm';
import { lawyers } from '../../../db/schema';
import { CreateLawyerDto } from './dto/create-lawyer.dto';
import { UpdateLawyerDto } from './dto/update-lawyer.dto';
import { LawyerResponseDto, LawyerListResponseDto } from './dto/lawyer-response.dto';

@Injectable()
export class LawyerService {
  /**
   * Create a new lawyer
   */
  async createLawyer(createDto: CreateLawyerDto, createdBy: string): Promise<LawyerResponseDto> {
    // Check if email already exists
    const existingEmail = await db
      .select()
      .from(lawyers)
      .where(eq(lawyers.email, createDto.email))
      .limit(1);

    if (existingEmail.length > 0) {
      throw new BadRequestException('Email already exists');
    }

    // Check if bar number already exists
    const existingBarNumber = await db
      .select()
      .from(lawyers)
      .where(eq(lawyers.barNumber, createDto.barNumber))
      .limit(1);

    if (existingBarNumber.length > 0) {
      throw new BadRequestException('Bar number already exists');
    }

    // Generate lawyer code
    const lawyerCode = await this.generateLawyerCode();

    // Create lawyer
    const [newLawyer] = await db
      .insert(lawyers)
      .values({
        lawyerCode,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        fullName: `${createDto.firstName} ${createDto.lastName}`,
        email: createDto.email,
        phone: createDto.phone,
        barNumber: createDto.barNumber,
        specialization: createDto.specialization,
        experience: createDto.experience,
        lawyerType: createDto.lawyerType,
        maxCases: createDto.maxCases || 10,
        officeLocation: createDto.officeLocation,
        jurisdiction: createDto.jurisdiction,
        createdBy,
      })
      .returning();

    return this.mapToResponseDto(newLawyer);
  }

  /**
   * Get all lawyers with filtering and pagination
   */
  async getLawyers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    specialization?: string,
    isAvailable?: boolean,
    isActive?: boolean,
    lawyerType?: string,
  ): Promise<LawyerListResponseDto> {
    const offset = (page - 1) * limit;
    const conditions: any[] = [];

    // Apply filters
    if (search) {
      conditions.push(
        sql`(${lawyers.fullName} ILIKE ${`%${search}%`} OR ${lawyers.email} ILIKE ${`%${search}%`} OR ${lawyers.barNumber} ILIKE ${`%${search}%`})`,
      );
    }

    if (specialization) {
      conditions.push(like(lawyers.specialization, `%${specialization}%`));
    }

    if (isAvailable !== undefined) {
      conditions.push(eq(lawyers.isAvailable, isAvailable));
    }

    if (isActive !== undefined) {
      conditions.push(eq(lawyers.isActive, isActive));
    }

    if (lawyerType) {
      conditions.push(eq(lawyers.lawyerType, lawyerType as any));
    }

    // Build query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db.select({ count: count() }).from(lawyers).where(whereClause);

    const total = totalResult.count;

    // Get lawyers with pagination
    const lawyersList = await db
      .select()
      .from(lawyers)
      .where(whereClause)
      .orderBy(desc(lawyers.createdAt))
      .limit(limit)
      .offset(offset);

    // Map to response DTOs
    const mappedLawyers = lawyersList.map((lawyer) => this.mapToResponseDto(lawyer));

    return {
      lawyers: mappedLawyers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get lawyer by ID
   */
  async getLawyerById(lawyerId: string): Promise<LawyerResponseDto> {
    const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.id, lawyerId)).limit(1);

    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    return this.mapToResponseDto(lawyer);
  }

  /**
   * Get lawyer by email
   */
  async getLawyerByEmail(email: string): Promise<LawyerResponseDto> {
    const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.email, email)).limit(1);

    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    return this.mapToResponseDto(lawyer);
  }

  /**
   * Update lawyer
   */
  async updateLawyer(
    lawyerId: string,
    updateDto: UpdateLawyerDto,
    updatedBy: string,
  ): Promise<LawyerResponseDto> {
    // Check if lawyer exists
    const existingLawyer = await this.getLawyerById(lawyerId);

    // Check email uniqueness if email is being updated
    if (updateDto.email && updateDto.email !== existingLawyer.email) {
      const emailExists = await db
        .select()
        .from(lawyers)
        .where(and(eq(lawyers.email, updateDto.email), sql`${lawyers.id} != ${lawyerId}`))
        .limit(1);

      if (emailExists.length > 0) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Check bar number uniqueness if bar number is being updated
    if (updateDto.barNumber && updateDto.barNumber !== existingLawyer.barNumber) {
      const barNumberExists = await db
        .select()
        .from(lawyers)
        .where(and(eq(lawyers.barNumber, updateDto.barNumber), sql`${lawyers.id} != ${lawyerId}`))
        .limit(1);

      if (barNumberExists.length > 0) {
        throw new BadRequestException('Bar number already exists');
      }
    }

    // Update lawyer
    const [updatedLawyer] = await db
      .update(lawyers)
      .set({
        ...updateDto,
        fullName:
          updateDto.firstName && updateDto.lastName
            ? `${updateDto.firstName} ${updateDto.lastName}`
            : undefined,
        updatedAt: new Date(),
        updatedBy,
      })
      .where(eq(lawyers.id, lawyerId))
      .returning();

    return this.mapToResponseDto(updatedLawyer);
  }

  /**
   * Delete lawyer (soft delete by setting isActive to false)
   */
  async deleteLawyer(
    lawyerId: string,
    deletedBy: string,
  ): Promise<{ success: boolean; message: string }> {
    const existingLawyer = await this.getLawyerById(lawyerId);

    // Check if lawyer has active cases
    if (existingLawyer.currentCases > 0) {
      throw new BadRequestException('Cannot delete lawyer with active cases');
    }

    await db
      .update(lawyers)
      .set({
        isActive: false,
        updatedAt: new Date(),
        updatedBy: deletedBy,
      })
      .where(eq(lawyers.id, lawyerId));

    return { success: true, message: 'Lawyer deleted successfully' };
  }

  /**
   * Get available lawyers for case assignment
   */
  async getAvailableLawyers(
    specialization?: string,
    jurisdiction?: string,
    limit: number = 10,
  ): Promise<LawyerResponseDto[]> {
    const conditions: any[] = [
      eq(lawyers.isActive, true),
      eq(lawyers.isAvailable, true),
      sql`${lawyers.currentCases} < ${lawyers.maxCases}`,
    ];

    if (specialization) {
      conditions.push(like(lawyers.specialization, `%${specialization}%`));
    }

    if (jurisdiction) {
      conditions.push(like(lawyers.jurisdiction, `%${jurisdiction}%`));
    }

    const availableLawyers = await db
      .select()
      .from(lawyers)
      .where(and(...conditions))
      .orderBy(asc(lawyers.currentCases), desc(lawyers.successRate))
      .limit(limit);

    return availableLawyers.map((lawyer) => this.mapToResponseDto(lawyer));
  }

  /**
   * Get lawyer workload statistics
   */
  async getLawyerWorkloadStats(lawyerId: string): Promise<{
    lawyerId: string;
    currentCases: number;
    maxCases: number;
    workloadPercentage: number;
    isAvailable: boolean;
    successRate: number;
    averageCaseDuration: number;
  }> {
    const lawyer = await this.getLawyerById(lawyerId);

    return {
      lawyerId: lawyer.id,
      currentCases: lawyer.currentCases,
      maxCases: lawyer.maxCases,
      workloadPercentage: lawyer.workloadPercentage,
      isAvailable: lawyer.isAvailable,
      successRate: lawyer.successRate,
      averageCaseDuration: lawyer.averageCaseDuration,
    };
  }

  /**
   * Generate unique lawyer code
   */
  private async generateLawyerCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get the last sequence number for today
    const lastLawyer = await db
      .select()
      .from(lawyers)
      .where(like(lawyers.lawyerCode, `LAW-${dateStr}-%`))
      .orderBy(desc(lawyers.createdAt))
      .limit(1);

    let sequenceNumber = 1;
    if (lastLawyer.length > 0) {
      const lastCode = lastLawyer[0].lawyerCode;
      const lastSequence = parseInt(lastCode.split('-')[2]);
      sequenceNumber = lastSequence + 1;
    }

    return `LAW-${dateStr}-${sequenceNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Map database record to response DTO
   */
  private mapToResponseDto(lawyer: any): LawyerResponseDto {
    const workloadPercentage =
      lawyer.maxCases > 0 ? (lawyer.currentCases / lawyer.maxCases) * 100 : 0;

    const workloadScore = this.calculateWorkloadScore(lawyer);

    return {
      id: lawyer.id,
      lawyerCode: lawyer.lawyerCode,
      firstName: lawyer.firstName,
      lastName: lawyer.lastName,
      fullName: lawyer.fullName,
      email: lawyer.email,
      phone: lawyer.phone,
      barNumber: lawyer.barNumber,
      specialization: lawyer.specialization,
      experience: lawyer.experience,
      lawyerType: lawyer.lawyerType,
      maxCases: lawyer.maxCases,
      currentCases: lawyer.currentCases,
      officeLocation: lawyer.officeLocation,
      jurisdiction: lawyer.jurisdiction,
      successRate: parseFloat(lawyer.successRate || '0'),
      averageCaseDuration: lawyer.averageCaseDuration || 0,
      isActive: lawyer.isActive,
      isAvailable: lawyer.isAvailable,
      workloadPercentage: Math.round(workloadPercentage * 100) / 100,
      workloadScore,
      createdAt: lawyer.createdAt,
      updatedAt: lawyer.updatedAt,
    };
  }

  /**
   * Calculate workload score for assignment
   */
  private calculateWorkloadScore(lawyer: any): number {
    const workloadPercentage =
      lawyer.maxCases > 0 ? (lawyer.currentCases / lawyer.maxCases) * 100 : 0;

    const successRate = parseFloat(lawyer.successRate || '0');
    const experience = lawyer.experience || 0;

    // Weighted score: lower workload percentage = higher score
    // Higher success rate = higher score
    // More experience = higher score
    const workloadScore =
      (100 - workloadPercentage) * 0.4 + successRate * 0.4 + Math.min(experience * 2, 20) * 0.2;

    return Math.round(workloadScore * 100) / 100;
  }
}
