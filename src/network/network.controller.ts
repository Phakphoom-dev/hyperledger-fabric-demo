import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NetworkConfig } from 'src/utils/networkConfig';
import { AssetDto } from './dto/assets.dto';
import { NetworkService } from './network.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('networks')
export class NetworkController {
  constructor(private networkService: NetworkService) {}

  @Post('init-ledger')
  async initLedger() {
    const networkConfig = new NetworkConfig();

    await this.networkService.displayInputParameters();

    const { client, gateway } = await this.networkService.connectNetwork();

    try {
      // Get a network instance representing the channel where the smart contract is deployed.
      const network = gateway.getNetwork(networkConfig.channelName);

      // Get the smart contract from the network.
      const contract = network.getContract(networkConfig.chaincodeName);

      await this.networkService.initLedger(contract);
    } catch (e) {
      console.log('🚀 ~ NetworkController ~ initLedger ~ e:', e);
    } finally {
      gateway.close();
      client.close();
    }
  }

  @Get('all-assets')
  async getAllAssets() {
    const networkConfig = new NetworkConfig();

    await this.networkService.displayInputParameters();

    const { client, gateway } = await this.networkService.connectNetwork();

    try {
      // Get a network instance representing the channel where the smart contract is deployed.
      const network = gateway.getNetwork(networkConfig.channelName);

      // Get the smart contract from the network.
      const contract = network.getContract(networkConfig.chaincodeName);

      const assets = await this.networkService.getAllAssets(contract);

      return { total: assets.length, data: assets };
    } catch (e) {
      console.log('🚀 ~ NetworkController ~ getAllAssets ~ e:', e);
    } finally {
      gateway.close();
      client.close();
    }
  }

  @Get('read-asset/:id')
  async readAssetByID(@Param('id') assetId: string) {
    const networkConfig = new NetworkConfig();

    await this.networkService.displayInputParameters();

    const { client, gateway } = await this.networkService.connectNetwork();

    try {
      // Get a network instance representing the channel where the smart contract is deployed.
      const network = gateway.getNetwork(networkConfig.channelName);

      // Get the smart contract from the network.
      const contract = network.getContract(networkConfig.chaincodeName);

      return await this.networkService.readAssetByID(contract, assetId);
    } catch (e) {
      throw new HttpException('Asset Not Found', HttpStatus.NOT_FOUND);
    } finally {
      gateway.close();
      client.close();
    }
  }

  @Post('create-asset')
  async createAsset(@Body() assetDto: AssetDto) {
    const networkConfig = new NetworkConfig();

    await this.networkService.displayInputParameters();

    const { client, gateway } = await this.networkService.connectNetwork();

    try {
      // Get a network instance representing the channel where the smart contract is deployed.
      const network = gateway.getNetwork(networkConfig.channelName);

      // Get the smart contract from the network.
      const contract = network.getContract(networkConfig.chaincodeName);

      await this.networkService.createAsset(contract, assetDto);

      return {
        message: 'created success',
        status: HttpStatus.CREATED,
      };
    } catch (e) {
      console.log('🚀 ~ NetworkController ~ getAllAssets ~ e:', e);
    } finally {
      gateway.close();
      client.close();
    }
  }
}
