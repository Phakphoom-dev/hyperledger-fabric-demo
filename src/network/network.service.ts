import { AssetDto } from './dto/assets.dto';
import { Injectable } from '@nestjs/common';
import { NetworkConfig } from 'src/utils/networkConfig';
import { promises as fs } from 'fs';
import * as grpc from '@grpc/grpc-js';
import {
  Contract,
  Gateway,
  Identity,
  Signer,
  connect,
  signers,
} from '@hyperledger/fabric-gateway';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class NetworkService {
  private networkConfig: NetworkConfig;
  private utf8Decoder: TextDecoder;

  constructor() {
    this.networkConfig = new NetworkConfig();
    this.utf8Decoder = new TextDecoder();
  }

  async connectNetwork(): Promise<{ gateway: Gateway; client: grpc.Client }> {
    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client: grpc.Client = await this.newGrpcConnection();

    const gateway: Gateway = await connect({
      client,
      identity: await this.newIdentity(),
      signer: await this.newSigner(),
      // Default timeouts for different gRPC calls
      evaluateOptions: () => {
        return { deadline: Date.now() + 5000 }; // 5 seconds
      },
      endorseOptions: () => {
        return { deadline: Date.now() + 15000 }; // 15 seconds
      },
      submitOptions: () => {
        return { deadline: Date.now() + 5000 }; // 5 seconds
      },
      commitStatusOptions: () => {
        return { deadline: Date.now() + 60000 }; // 1 minute
      },
    });

    return { client, gateway };
  }

  async displayInputParameters(): Promise<void> {
    console.log(`channelName:       ${this.networkConfig.channelName}`);
    console.log(`chaincodeName:     ${this.networkConfig.chaincodeName}`);
    console.log(`mspId:             ${this.networkConfig.mspId}`);
    console.log(`cryptoPath:        ${this.networkConfig.cryptoPath}`);
    console.log(`keyDirectoryPath:  ${this.networkConfig.keyDirectoryPath}`);
    console.log(`certPath:          ${this.networkConfig.certPath}`);
    console.log(`tlsCertPath:       ${this.networkConfig.tlsCertPath}`);
    console.log(`peerEndpoint:      ${this.networkConfig.peerEndpoint}`);
    console.log(`peerHostAlias:     ${this.networkConfig.peerHostAlias}`);
  }

  private async newGrpcConnection() {
    const tlsRootCert = await fs.readFile(this.networkConfig.tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(this.networkConfig.peerEndpoint, tlsCredentials, {
      'grpc.ssl_target_name_override': this.networkConfig.peerHostAlias,
    });
  }

  private async newIdentity(): Promise<Identity> {
    const credentials = await fs.readFile(this.networkConfig.certPath);

    return { mspId: this.networkConfig.mspId, credentials };
  }

  private async newSigner(): Promise<Signer> {
    const files = await fs.readdir(this.networkConfig.keyDirectoryPath);
    const keyPath = path.resolve(this.networkConfig.keyDirectoryPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);

    return signers.newPrivateKeySigner(privateKey);
  }

  /**
   * This type of transaction would typically only be run once by an application the first time it was started after its
   * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
   */
  async initLedger(contract: Contract): Promise<void> {
    console.log(
      '\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger',
    );

    await contract.submitTransaction('InitLedger');

    console.log('*** Transaction committed successfully');
  }

  /**
   * Evaluate a transaction to query ledger state.
   */
  async getAllAssets(contract: Contract): Promise<any> {
    console.log(
      '\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger',
    );

    const resultBytes = await contract.evaluateTransaction('GetAllAssets');

    const resultJson = this.utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);

    console.log('*** Result:', result);

    return result;
  }

  /**
   * Submit a transaction synchronously, blocking until it has been committed to the ledger.
   */
  async createAsset(contract: Contract, assetDto: AssetDto): Promise<void> {
    const assetId = `asset${Date.now()}`;
    const { color, size, owner, appraisedValue } = assetDto;

    console.log(
      '\n--> Submit Transaction: CreateAsset, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments',
    );

    await contract.submitTransaction(
      'CreateAsset',
      assetId,
      color,
      size.toString(),
      owner,
      appraisedValue.toString(),
    );

    console.log('*** Transaction committed successfully');
  }
}
