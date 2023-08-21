import * as Utils from '../utils';
import Draw from '../draw';
import { Cartesian3 } from '@examples/cesium';

export default class CurvedArrow extends Draw {
  points: Cartesian3[] = [];
  arrowLengthScale: number = 5;
  maxArrowLength: number = 3000000;
  type: 'polygon' | 'line';
  t: number;

  constructor(cesium: any, viewer: any, style: any) {
    super(cesium, viewer);
    this.cesium = cesium;
    this.type = 'line';
    this.t = 0.3;
    this.setState('drawing');
    this.onDoubleClick();
  }

  /**
   * Add points only on click events
   */
  addPoint(cartesian: Cartesian3) {
    this.points.push(cartesian);
    if (this.points.length < 2) {
      this.onMouseMove();
    } else if (this.points.length === 2) {
      this.setGeometryPoints(this.points);
      this.drawLine();
    }
  }

  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    const tempPoints = [...this.points, cartesian];
    if (tempPoints.length === 2) {
      this.setGeometryPoints(tempPoints);
      this.drawLine();
    } else {
      const geometryPoints = this.createLine(tempPoints);
      this.setGeometryPoints(geometryPoints);
      this.drawLine();
    }
  }

  /**
   * In edit mode, drag key points to update corresponding key point data.
   */
  updateDraggingPoint(cartesian: Cartesian3, index: number) {
    this.points[index] = cartesian;
    const geometryPoints = this.createLine(this.points);
    this.setGeometryPoints(geometryPoints);
    this.drawLine();
  }

  /**
   * Generate geometric shapes based on key points.
   */
  createLine(positions: Cartesian3[]) {
    const lnglatPoints = positions.map((pnt) => {
      return this.cartesianToLnglat(pnt);
    });
    const curvePoints = Utils.getCurvePoints(this.t, lnglatPoints);
    const pnt1 = lnglatPoints[lnglatPoints.length - 2];
    const pnt2 = lnglatPoints[lnglatPoints.length - 1];

    // const distance = Utils.MathDistance(pnt1, pnt2);
    // const distance = Utils.wholeDistance(lnglatPoints);
    // let len = distance / this.arrowLengthScale;
    let len = 1.5;
    len = len > this.maxArrowLength ? this.maxArrowLength : len;
    const leftPnt = Utils.getThirdPoint(pnt1, pnt2, Math.PI / 6, len, false);
    const rightPnt = Utils.getThirdPoint(pnt1, pnt2, Math.PI / 6, len, true);
    const temp = [].concat(...curvePoints);
    const points = [...temp, ...leftPnt, ...pnt2, ...rightPnt];
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(points);
    return cartesianPoints;
  }

  getPoints() {
    return this.points;
  }
}
