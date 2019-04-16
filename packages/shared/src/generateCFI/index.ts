import { Host } from '@readium/glue-rpc';
import { GenerateCFIHandler } from './handler';

export default new Host('generateCFI', GenerateCFIHandler);
