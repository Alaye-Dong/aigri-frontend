import { transformRecordToOption } from '@/utils/common';

/** enable status */
export const enableStatusRecord: Record<Api.Common.EnableStatus, string> = {
  '0': '正常',
  '1': '停用'
};

export const enableStatusOptions = transformRecordToOption(enableStatusRecord);

/** crop status */
export const cropStatusRecord: Record<Api.Farming.CropStatus, string> = {
  1: '种植中',
  2: '已收获',
  3: '已废弃'
};

export const cropStatusOptions = transformRecordToOption(cropStatusRecord);

/** crop status display map (text + NTag type) */
export const cropStatusMap: Record<
  Api.Farming.CropStatus,
  { text: string; type: 'success' | 'warning' | 'error' }
> = {
  1: { text: '种植中', type: 'success' },
  2: { text: '已收获', type: 'warning' },
  3: { text: '已废弃', type: 'error' }
};
