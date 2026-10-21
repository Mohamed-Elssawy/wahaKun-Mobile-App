/** The exact shape RN's FormData needs. Outside features/ because useImagePicker sits below. */
export type PickedImage = {
  uri: string;
  type?: string;
  fileName?: string;
};
