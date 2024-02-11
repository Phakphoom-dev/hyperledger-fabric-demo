import { IsNotEmpty } from 'class-validator';

export class AssetDto {
  @IsNotEmpty()
  color: string;

  @IsNotEmpty()
  owner: string;

  @IsNotEmpty()
  size: number;

  @IsNotEmpty()
  appraisedValue: number;
}
