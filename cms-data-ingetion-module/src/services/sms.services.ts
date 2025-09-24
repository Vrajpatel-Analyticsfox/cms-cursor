import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

// SMS Response Interfaces
export interface SmsSuccessResponse {
  ErrorCode: number;
  ErrorDescription: string | null;
  Data: SmsMessageData[];
}

export interface SmsMessageData {
  MessageErrorCode: number;
  MessageErrorDescription: string;
  MobileNumber: string;
  MessageId: string;
  Custom: string | null;
}

export interface SmsValidationError {
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export interface SmsErrorResponse {
  ErrorCode: number;
  ErrorDescription: string;
  Data: null;
}

export interface SmsServiceResult {
  success: boolean;
  messageId?: string;
  mobileNumber?: string;
  errorCode?: number;
  errorDescription?: string;
  rawResponse?: any;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Send SMS with comprehensive response handling
   * @param mobileNumbers - Mobile number(s) to send SMS to
   * @param message - SMS message content
   * @returns SmsServiceResult with success status and details
   */
  async sendSms(mobileNumbers: string, message: string): Promise<SmsServiceResult> {
    try {
      const smsApiUrl = this.configService.get<string>('SMS_API_URL');
      const senderId = this.configService.get<string>('SMS_SENDER_ID');
      const apiKey = this.configService.get<string>('SMS_API_KEY');
      const clientId = this.configService.get<string>('SMS_CLIENT_ID');
      const isUnicode =
        this.configService.get<string>('SMS_IS_UNICODE', 'false').toLowerCase() === 'true';
      const isFlash =
        this.configService.get<string>('SMS_IS_FLASH', 'false').toLowerCase() === 'true';
      const dataCoding = parseInt(this.configService.get<string>('SMS_DATA_CODING', '0'));

      if (!smsApiUrl || !senderId || !apiKey || !clientId) {
        throw new Error('SMS configuration is incomplete. Please check environment variables.');
      }

      this.logger.log(`📤 Sending SMS to ${mobileNumbers}`);

      const response: AxiosResponse = await axios.post(
        smsApiUrl,
        {
          senderId,
          is_Unicode: isUnicode,
          is_Flash: isFlash,
          dataCoding,
          message,
          mobileNumbers,
          apiKey,
          clientId,
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      // Handle response based on HTTP status code
      return this.handleSmsResponse(response, mobileNumbers);
    } catch (error) {
      this.logger.error('❌ SMS API Error:', error.message);

      // Handle axios errors (network, timeout, etc.)
      if (error.response) {
        // Server responded with error status
        return this.handleSmsResponse(error.response, mobileNumbers);
      } else if (error.request) {
        // Network error
        return {
          success: false,
          errorCode: -1,
          errorDescription: 'Network error - unable to reach SMS service',
          rawResponse: error.message,
        };
      } else {
        // Other error
        return {
          success: false,
          errorCode: -2,
          errorDescription: `SMS service error: ${error.message}`,
          rawResponse: error.message,
        };
      }
    }
  }

  /**
   * Handle SMS API response based on HTTP status code
   */
  private handleSmsResponse(response: AxiosResponse, mobileNumbers: string): SmsServiceResult {
    const statusCode = response.status;
    const responseData = response.data;

    this.logger.log(`📊 SMS API Response - Status: ${statusCode}`);

    switch (statusCode) {
      case 200:
        return this.handleSuccessResponse(responseData, mobileNumbers);

      case 400:
        return this.handleBadRequestResponse(responseData, mobileNumbers);

      case 401:
        return this.handleUnauthorizedResponse(responseData, mobileNumbers);

      case 500:
        return this.handleInternalServerErrorResponse(responseData, mobileNumbers);

      default:
        return this.handleUnknownResponse(responseData, statusCode, mobileNumbers);
    }
  }

  /**
   * Handle 200 OK response - SMS sent successfully
   */
  private handleSuccessResponse(
    responseData: SmsSuccessResponse,
    mobileNumbers: string,
  ): SmsServiceResult {
    this.logger.log(`✅ SMS sent successfully to ${mobileNumbers}`);

    // Check if ErrorCode is 0 (success)
    if (responseData.ErrorCode === 0) {
      // Get the first message data (assuming single recipient for now)
      const messageData = responseData.Data?.[0];

      if (messageData && messageData.MessageErrorCode === 0) {
        this.logger.log(`📱 Message ID: ${messageData.MessageId}`);
        return {
          success: true,
          messageId: messageData.MessageId,
          mobileNumber: messageData.MobileNumber,
          rawResponse: responseData,
        };
      } else {
        // ErrorCode is 0 but individual message failed
        const errorDesc = messageData?.MessageErrorDescription || 'Unknown message error';
        this.logger.warn(`⚠️ SMS API success but message failed: ${errorDesc}`);
        return {
          success: false,
          errorCode: messageData?.MessageErrorCode || -1,
          errorDescription: errorDesc,
          rawResponse: responseData,
        };
      }
    } else {
      // ErrorCode is not 0
      this.logger.error(`❌ SMS API returned error code: ${responseData.ErrorCode}`);
      return {
        success: false,
        errorCode: responseData.ErrorCode,
        errorDescription: responseData.ErrorDescription || 'Unknown API error',
        rawResponse: responseData,
      };
    }
  }

  /**
   * Handle 400 Bad Request response - validation error
   */
  private handleBadRequestResponse(
    responseData: SmsValidationError,
    mobileNumbers: string,
  ): SmsServiceResult {
    this.logger.error(`❌ SMS validation error for ${mobileNumbers}`);

    const errorMessages =
      responseData.errors?.map((err) => `${err.field}: ${err.message}`).join(', ') ||
      'Validation error';

    return {
      success: false,
      errorCode: 400,
      errorDescription: `Validation error: ${errorMessages}`,
      rawResponse: responseData,
    };
  }

  /**
   * Handle 401 Unauthorized response - invalid API key or client ID
   */
  private handleUnauthorizedResponse(
    responseData: SmsErrorResponse,
    mobileNumbers: string,
  ): SmsServiceResult {
    this.logger.error(`❌ SMS authentication failed for ${mobileNumbers}`);

    return {
      success: false,
      errorCode: 401,
      errorDescription: responseData.ErrorDescription || 'Invalid API key or client ID',
      rawResponse: responseData,
    };
  }

  /**
   * Handle 500 Internal Server Error response
   */
  private handleInternalServerErrorResponse(
    responseData: any,
    mobileNumbers: string,
  ): SmsServiceResult {
    this.logger.error(`❌ SMS server error for ${mobileNumbers}`);

    return {
      success: false,
      errorCode: 500,
      errorDescription: responseData.error || 'Internal server error',
      rawResponse: responseData,
    };
  }

  /**
   * Handle unknown response status codes
   */
  private handleUnknownResponse(
    responseData: any,
    statusCode: number,
    mobileNumbers: string,
  ): SmsServiceResult {
    this.logger.warn(`⚠️ Unknown SMS response status ${statusCode} for ${mobileNumbers}`);

    return {
      success: false,
      errorCode: statusCode,
      errorDescription: `Unknown response status: ${statusCode}`,
      rawResponse: responseData,
    };
  }
}
