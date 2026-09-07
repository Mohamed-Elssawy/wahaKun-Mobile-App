/** SVGs become React components via react-native-svg-transformer. */
declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}

/** Raster images resolve to Image's opaque source handle, so screens can import instead of require. */
declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';

  const content: ImageSourcePropType;
  export default content;
}

declare module '*.jpg' {
  import type { ImageSourcePropType } from 'react-native';

  const content: ImageSourcePropType;
  export default content;
}

declare module '*.jpeg' {
  import type { ImageSourcePropType } from 'react-native';

  const content: ImageSourcePropType;
  export default content;
}
