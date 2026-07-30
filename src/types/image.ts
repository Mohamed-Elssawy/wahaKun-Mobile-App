/** The exact shape RN's FormData needs, so it goes into a multipart body unchanged. */
// Outside features/ because hooks/useImagePicker sits below them and cannot reach up.
export type PickedImage = {
  uri: string;
  type?: string;
  fileName?: string;
};
