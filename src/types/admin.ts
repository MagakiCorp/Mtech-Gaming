import type { BaseDocument } from "./index";

export interface Admin extends BaseDocument {
  email: string;
  displayName: string;
  active: boolean;
}
