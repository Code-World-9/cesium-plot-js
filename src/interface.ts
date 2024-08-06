// @ts-ignore
import * as CesiumTypeOnly from 'cesium';

export type PolygonStyle = {
  // material?: CesiumTypeOnly.MaterialProperty | CesiumTypeOnly.Color;
  // outlineWidth?: number;
  // outlineMaterial?: CesiumTypeOnly.MaterialProperty | CesiumTypeOnly.Color;
  positions?: CesiumTypeOnly.Cartesian3[];
  shade_switch: boolean
  range_min: number
  range_max: number
  fill: {
    is_show: boolean
    color: string
    hover_color: string
  }
  sideline: {
    is_show: boolean
    color: string
    hover_color: string
    width: number
  }
};

export type ImageStyle = {
  material?: CesiumTypeOnly.MaterialProperty | CesiumTypeOnly.Color;
  outlineWidth?: number;
  outlineMaterial?: CesiumTypeOnly.MaterialProperty | CesiumTypeOnly.Color;
  positions?: CesiumTypeOnly.Cartesian3[];
  rotationIcon: string;
};

export type LineStyle = {
  material?: CesiumTypeOnly.Color;
  lineWidth?: number;
};

export type TagStyle = {
  icon: {
    image: string;
    // activeImage?: string;
    width: number;
    height: number;
    bg_color?: string;
    range_min?: number;
    range_max?: number;
  };
  title: {
    text?: string;
    no_visible?: boolean;
    offset: number[];
    font_color: string;
    show_bg: boolean;
    bg_color: string;
    font_size: number;
    background_stroke_visible: boolean;
    background_stroke_line_size: number;
    background_stroke_color: string;
    distance_icon_space: number;
    shadow_raduis: boolean;
    range_min: number;
    range_max: number;
  };
};

export type State = 'drawing' | 'edit' | 'static' | 'animating' | 'hidden';
export type GeometryStyle = PolygonStyle | LineStyle | TagStyle | ImageStyle;

export type EventType =
  | 'drawStart'
  | 'drawUpdate'
  | 'drawEnd'
  | 'editEnd'
  | 'editStart'
  | 'rotationUpdate'
  | 'onTagClick'
  | 'onTagDBClick';
export type EventListener = (eventData?: any) => void;

export type VisibleAnimationOpts = {
  duration?: number;
  delay?: number;
  callback?: () => void;
};

export type GrowthAnimationOpts = {
  duration: number;
  delay: number;
  callback: Function;
};

export type Shape = 'polygon' | 'line' | 'tag' | 'image';
