import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Controllers
import { StateController } from './state.controller';
import { DpdBucketController } from './dpd-bucket.controller';
import { ChannelController } from './channel.controller';
import { LanguageController } from './language.controller';
import { TemplateController } from './template.controller';
import { ProductGroupController } from './product-group.controller';
import { ProductTypeController } from './product-type.controller';
import { ProductSubtypeController } from './product-subtype.controller';
import { ProductVariantController } from './product-variant.controller';
import { SchemaConfigurationController } from './schema-configuration.controller';

// Services
import { StateService } from './state.service';
import { DpdBucketService } from './dpd-bucket.service';
import { ChannelService } from './channel.service';
import { LanguageService } from './language.service';
import { TemplateService } from './template.service';
import { ProductGroupService } from './product-group.service';
import { ProductTypeService } from './product-type.service';
import { ProductSubtypeService } from './product-subtype.service';
import { ProductVariantService } from './product-variant.service';
import { SchemaConfigurationService } from './schema-configuration.service';

// Event Listeners
import { MasterDataUpdatedListener } from './master-data-updated.listener';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [
    StateController,
    DpdBucketController,
    ChannelController,
    LanguageController,
    TemplateController,
    ProductGroupController,
    ProductTypeController,
    ProductSubtypeController,
    ProductVariantController,
    SchemaConfigurationController,
  ],
  providers: [
    StateService,
    DpdBucketService,
    ChannelService,
    LanguageService,
    TemplateService,
    ProductGroupService,
    ProductTypeService,
    ProductSubtypeService,
    ProductVariantService,
    SchemaConfigurationService,
    MasterDataUpdatedListener,
  ],
  exports: [
    StateService,
    DpdBucketService,
    ChannelService,
    LanguageService,
    TemplateService,
    ProductGroupService,
    ProductTypeService,
    ProductSubtypeService,
    ProductVariantService,
    SchemaConfigurationService,
  ],
})
export class MasterDataModule {}
