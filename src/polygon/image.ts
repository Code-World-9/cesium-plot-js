import Base from '../base';
// @ts-ignore
import { Cartesian3, Cartesian2 } from 'cesium';

import { ImageStyle, Shape } from '../interface';
import cloneDeep from 'lodash.clonedeep';

export default class Image extends Base {
  points: Cartesian3[] = [];

  constructor(cesium: any, viewer: any, style?: ImageStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.setState('drawing');
    this.onDoubleClick();
    this.drawImage();
  }

  getType(): Shape {
    return 'image';
  }

  drawImage() {
    const style = this.style as ImageStyle;
    if (!this.imageEntity) {
      const callback = () => {
        return new this.cesium.PolygonHierarchy(this.geometryPoints);
        // return new this.cesium.Rectangle.fromCartesianArray(this.geometryPoints);
      };
      const imageMaterial = new this.cesium.ImageMaterialProperty({
        image: style.material as any,
        transparent: true,
        color: this.cesium.Color.WHITE.withAlpha(0.5),
      });
      // 矩形算法
      // const p = new this.cesium.RectangleGraphics({
      //   coordinates: new this.cesium.CallbackProperty(callback, false),
      //   height: 0,
      //   material: imageMaterial,
      //   outline: true,
      //   outlineColor: this.cesium.Color.BLACK,
      //   outlineWidth: 100,
      //   zIndex: 99,
      // });
      // 多边形算法
      const p = new this.cesium.PolygonGraphics({
        hierarchy: new this.cesium.CallbackProperty(callback, false),
        height: 0,
        material: imageMaterial,
        outline: true,
        outlineColor: this.cesium.Color.BLACK,
        outlineWidth: 100,
        zIndex: 99,
        stRotation: this.cesium.Math.toRadians(0),
      });
      this.imageEntity = this.viewer.entities.add({
        id: '66666' + Math.random() * 1000,
        polygon: p,
        // rectangle: p,
      });
      this.points.push(...style.positions);
      this.setGeometryPoints(style.positions);
      setTimeout(() => {
        this.eventDispatcher.dispatchEvent('drawEnd', this.getPoints());
      }, 1000);
    }
  }

  onClick() {
    this.eventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.eventHandler.setInputAction((evt: any) => {
      const pickedObject = this.viewer.scene.pick(evt.position);
      const hitEntities = this.cesium.defined(pickedObject) && pickedObject.id instanceof this.cesium.Entity;
      const activeEntity = this.imageEntity;
      if (this.state === 'drawing') {
        this.finishDrawing();
      } else if (this.state === 'edit') {
        if (!hitEntities || activeEntity.id !== pickedObject.id.id) {
          this.setState('static');
          this.removeControlPoints();
          this.disableDrag();
          this.eventDispatcher.dispatchEvent('editEnd', this.getPoints());
        }
      } else if (this.state === 'static') {
        if (hitEntities && activeEntity.id === pickedObject.id.id) {
          this.setState('edit');
          this.draggable();
          this.addControlPoints();
          this.eventDispatcher.dispatchEvent('editStart');
        }
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }
  isClockwise(xA: number, yA: number, xB: number, yB: number, xC: number, yC: number) {
    let vecAB_x = xB - xA;
    let vecAB_y = yB - yA;
    let vecAC_x = xC - xA;
    let vecAC_y = yC - yA;

    // 计算叉积
    let crossProduct = vecAB_x * vecAC_y - vecAB_y * vecAC_x;

    // 如果叉积为正，则AC在AB的逆时针方向
    // 如果叉积为负，则AC在AB的顺时针方向
    // 如果叉积为零，则AB和AC共线
    if (crossProduct > 0) {
      return false; // 逆时针
    } else if (crossProduct < 0) {
      return true; // 顺时针
    } else {
      // AB和AC共线，这里你可能需要特别处理
      return null; // 或者抛出一个错误
    }
  }
  rotatePoint(cx: number, cy: number, x: number, y: number, angleDeg: number) {
    // 将角度从度转换为弧度
    const angleRad = (angleDeg * Math.PI) / 180;

    // 计算旋转后的新坐标
    const xPrime = (x - cx) * Math.cos(angleRad) - (y - cy) * Math.sin(angleRad) + cx;
    const yPrime = (x - cx) * Math.sin(angleRad) + (y - cy) * Math.cos(angleRad) + cy;

    return { x: xPrime, y: yPrime };
  }
  getOriginPoints() {
    const screenPoints = this.getScreenPoints();
    const width = this.calculateScreenDistance(
      screenPoints[0].x,
      screenPoints[0].y,
      screenPoints[3].x,
      screenPoints[3].y,
    );
    const height = this.calculateScreenDistance(
      screenPoints[0].x,
      screenPoints[0].y,
      screenPoints[1].x,
      screenPoints[1].y,
    );
    const center = {
      x: (screenPoints[0].x + screenPoints[2].x) / 2,
      y: (screenPoints[0].y + screenPoints[2].y) / 2,
    };
    const originPoints = [
      { x: center.x + width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y + height / 2 },
      { x: center.x - width / 2, y: center.y + height / 2 },
      { x: center.x - width / 2, y: center.y - height / 2 },
    ];
    return originPoints;
  }
  getRotationAngle(xPosition: number, yPosition: number, index: number) {
    const screenPoints = this.getScreenPoints();
    const width = this.calculateScreenDistance(
      screenPoints[0].x,
      screenPoints[0].y,
      screenPoints[3].x,
      screenPoints[3].y,
    );
    const height = this.calculateScreenDistance(
      screenPoints[0].x,
      screenPoints[0].y,
      screenPoints[1].x,
      screenPoints[1].y,
    );
    const center = {
      x: (screenPoints[0].x + screenPoints[2].x) / 2,
      y: (screenPoints[0].y + screenPoints[2].y) / 2,
    };
    const originPoints = [
      { x: center.x + width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y + height / 2 },
      { x: center.x - width / 2, y: center.y + height / 2 },
      { x: center.x - width / 2, y: center.y - height / 2 },
    ];

    const angle = this.calculateAngle(
      center.x,
      center.y,
      originPoints[index].x,
      originPoints[index].y,
      xPosition,
      yPosition,
    );
    const isClockwise = this.isClockwise(
      center.x,
      center.y,
      originPoints[index].x,
      originPoints[index].y,
      xPosition,
      yPosition,
    );
    return isClockwise ? -angle : angle;
  }
  calculateAngle(xA: number, yA: number, xB: number, yB: number, xC: number, yC: number) {
    // 计算向量AB和AC
    let vecAB_x = xB - xA;
    let vecAB_y = yB - yA;
    let vecAC_x = xC - xA;
    let vecAC_y = yC - yA;

    // 计算向量AB和AC的模长
    let magAB = Math.sqrt(vecAB_x * vecAB_x + vecAB_y * vecAB_y);
    let magAC = Math.sqrt(vecAC_x * vecAC_x + vecAC_y * vecAC_y);

    // 防止除以零（虽然在实际应用中，如果两个点重合，这个函数可能不应该被调用）
    if (magAB === 0 || magAC === 0) {
      return 0; // 或者你可以抛出一个错误
    }

    // 计算向量AB和AC的点积
    let dotProduct = vecAB_x * vecAC_x + vecAB_y * vecAC_y;

    // 使用点积和模长计算夹角的余弦值
    let cosTheta = dotProduct / (magAB * magAC);

    // 确保余弦值在有效范围内内（-1 到 1）
    cosTheta = Math.min(Math.max(cosTheta, -1), 1);

    // 计算夹角（注意：acos返回的是弧度，需要转换为度）
    let angleInRadians = Math.acos(cosTheta);
    let angleInDegrees = angleInRadians * (180 / Math.PI);

    // 返回值在0到180度之间
    return angleInDegrees;
  }
  addRotationControl() {
    const screenPoints = this.getScreenPoints();
    const controlPoint = {
      x: screenPoints[0].x + 20,
      y: screenPoints[0].y - 20,
    };
    let _this = this;
    const position = this.pixelToCartesian(controlPoint);
    this.rotationPoint = this.viewer.entities.add({
      position,
      billboard: {
        image: _this.style.rotationIcon,
        width: 20,
        height: 20,
      },
    });
    this.rotationEventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    let isRotation = false;
    // Listen for left mouse button press events
    this.rotationEventHandler.setInputAction((clickEvent: any) => {
      const pickedObject = this.viewer.scene.pick(clickEvent.position);

      if (this.cesium.defined(pickedObject)) {
        if (pickedObject.id === this.rotationPoint) {
          isRotation = true;
        }
        // Disable default camera interaction.
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Listen for mouse movement events
    this.rotationEventHandler.setInputAction((moveEvent: any) => {
      if (isRotation) {
        const screenPoints = this.getScreenPoints();
        const center = {
          x: (screenPoints[0].x + screenPoints[2].x) / 2,
          y: (screenPoints[0].y + screenPoints[2].y) / 2,
        };
        // const controlPoint = {
        //   x: screenPoints[0].x + 20,
        //   y: screenPoints[0].y - 20,
        // };
        const angle = this.getRotationAngle(moveEvent.endPosition.x, moveEvent.endPosition.y, 0);
        // 矩形算法 cesium矩形旋转会变形
        // this.imageEntity.rectangle.rotation = this.cesium.Math.toRadians(isClockwise ? angle : -angle);
        // this.imageEntity.rectangle.stRotation = this.cesium.Math.toRadians(isClockwise ? angle : -angle);

        const newControlPoint = this.rotatePoint(center.x, center.y, controlPoint.x, controlPoint.y, angle);

        this.rotationPoint.position.setValue(this.pixelToCartesian(newControlPoint));

        console.log(666666, angle, this.imageEntity.polygon.stRotation);
        this.imageEntity.polygon.stRotation = this.cesium.Math.toRadians(angle);
        this.eventDispatcher.dispatchEvent('rotationUpdate', angle);

        // 多边形算法 多变形不会变形 但是旋转后坐标计算难和纹理没法旋转
        // const rotationPoints = screenPoints.map((point) => {
        //   return this.rotatePoint(center.x, center.y, point.x, point.y, angle);
        // });
        const rotationPoints = this.getOriginPoints().map((point) => {
          return this.rotatePoint(center.x, center.y, point.x, point.y, angle);
        });
        this.points = this.getCartesianPoints(rotationPoints);
        this.setGeometryPoints(this.points);
        this.updateAllDraggingPoints();
      }
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.rotationEventHandler.setInputAction(() => {
      isRotation = false;
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    }, this.cesium.ScreenSpaceEventType.LEFT_UP);
  }
  updateRotationPoint() {
    const screenPoints = this.getScreenPoints();
    const controlPoint = {
      x: screenPoints[0].x + 20,
      y: screenPoints[0].y - 20,
    };
    const position = this.pixelToCartesian(controlPoint);
    this.rotationPoint.position.setValue(position);
  }
  removeRotationControl() {
    if (this.rotationPoint) {
      this.viewer.entities.remove(this.rotationPoint);
      this.rotationEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_DOWN);
      this.rotationEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this.rotationEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_UP);
    }
  }

  /**
   * Add points only on click events
   */
  addPoint(cartesian: Cartesian3) {}

  /**
   * backout the last point
   */
  removePoint() {}

  /**
   * Compare whether the positions of two points are equal.
   */
  comparePositions(point1: Cartesian3, point2: Cartesian3) {
    const lnglat1 = this.cartesianToLnglat(point1);
    const lnglat2 = this.cartesianToLnglat(point2);
    return lnglat1[0] === lnglat2[0] && lnglat1[1] === lnglat2[1];
  }

  /**
   * Calculate the distance between two points
   */
  calculateDistance(point1: Cartesian3, point2: Cartesian3) {
    return this.cesium.Cartesian3.distance(point1, point2);
  }

  // calculateScreenDistance(point1: Cartesian3, point2: Cartesian3) {
  //   const p1 = this.cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, point1);
  //   const p2 = this.cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, point2);
  //   console.log('p1', p1, 'p2', p2);
  //   return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  // }
  calculateScreenDistance(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    this.drawImage();
  }

  getScreenPoints() {
    const screenPoints = this.points.map((point) => {
      return this.cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, point);
    });
    return screenPoints;
  }

  //矩形算法
  // getNewScreenPoint(screenPoints: Cartesian2[], distanceX: number, distanceY: number, index: number) {
  //   let points = cloneDeep(screenPoints);
  //   if (index === 0) {
  //     points[0].x += distanceX;
  //     points[0].y -= distanceY;
  //     points[1].x = points[0].x;
  //     points[3].y = points[0].y;
  //   } else if (index === 1) {
  //     points[1].x += distanceX;
  //     points[1].y += distanceY;
  //     points[0].x = points[1].x;
  //     points[2].y = points[1].y;
  //   } else if (index === 2) {
  //     points[2].x += distanceX;
  //     points[2].y -= distanceY;
  //     points[1].y = points[2].y;
  //     points[3].x = points[2].x;
  //   } else if (index === 3) {
  //     points[3].x += distanceX;
  //     points[3].y += distanceY;
  //     points[0].y = points[3].y;
  //     points[2].x = points[3].x;
  //   }
  //   return points;
  // }

  //多边形算法
  getNewScreenPoint(screenPoints: Cartesian2[], xPosition: number, yPosition: number, index: number) {
    const width = this.calculateScreenDistance(
      screenPoints[0].x,
      screenPoints[0].y,
      screenPoints[3].x,
      screenPoints[3].y,
    );
    const height = this.calculateScreenDistance(
      screenPoints[0].x,
      screenPoints[0].y,
      screenPoints[1].x,
      screenPoints[1].y,
    );
    const center = {
      x: (screenPoints[0].x + screenPoints[2].x) / 2,
      y: (screenPoints[0].y + screenPoints[2].y) / 2,
    };

    const oldDistance = this.calculateScreenDistance(center.x, center.y, screenPoints[index].x, screenPoints[index].y);
    const newDistance = this.calculateScreenDistance(center.x, center.y, xPosition, yPosition);
    const scale = newDistance / oldDistance;

    const newWidth = width * scale;
    const newHeight = height * scale;

    const originPoints = [
      { x: center.x + newWidth / 2, y: center.y - newHeight / 2 },
      { x: center.x + newWidth / 2, y: center.y + newHeight / 2 },
      { x: center.x - newWidth / 2, y: center.y + newHeight / 2 },
      { x: center.x - newWidth / 2, y: center.y - newHeight / 2 },
    ];
    // const angle = this.getRotationAngle(screenPoints[index].x, screenPoints[index].x, index);
    const angle = this.cesium.Math.toDegrees(this.imageEntity.polygon.stRotation);

    const newPoints = originPoints.map((point) => {
      return this.rotatePoint(center.x, center.y, point.x, point.y, angle);
    });

    const newControlPoint = this.rotatePoint(center.x, center.y, originPoints[0].x + 20, originPoints[0].y - 20, angle);
    this.rotationPoint.position.setValue(this.pixelToCartesian(newControlPoint));
    // this.imageEntity.polygon.stRotation = this.cesium.Math.toRadians(angle);
    return newPoints;
  }

  getCartesianPoints(screenPoints: Cartesian2[]) {
    return screenPoints.map((point) => {
      const ray = this.viewer.camera.getPickRay({ x: point.x, y: point.y });
      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      return cartesian;
    });
  }

  updateAllDraggingPoints() {
    this.controlPoints.forEach((point, index) => {
      point.position.setValue(this.points[index]);
    });
  }

  /**
   * In edit mode, drag key points to update corresponding key point data.
   */
  updateDraggingPoint(cartesian: Cartesian3, index: number) {
    // 矩形算法
    // const screenPoints = this.getScreenPoints();
    // const ratio = (screenPoints[0].x - screenPoints[3].x) / (screenPoints[1].y - screenPoints[0].y);
    // console.log('ratio', ratio);
    // const before = screenPoints[index];
    // const moveScreenPoint = this.cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, cartesian);
    // const distanceX = moveScreenPoint.x - before.x;
    // const distanceY = distanceX / ratio;
    // console.log('distanceX', distanceX, 'distanceY', distanceY, screenPoints);
    // const newScreenPoints = this.getNewScreenPoint(screenPoints, distanceX, distanceY, index);
    // const newPoints = this.getCartesianPoints(newScreenPoints);

    // 多边形算法
    const screenPoints = this.getScreenPoints();
    const center = {
      x: (screenPoints[0].x + screenPoints[2].x) / 2,
      y: (screenPoints[0].y + screenPoints[2].y) / 2,
    };
    const before = screenPoints[index];
    const moveScreenPoint = this.cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, cartesian);
    const xPosition = moveScreenPoint.x;
    const yPosition = before.y - ((before.x - xPosition) * (center.y - before.y)) / (center.x - before.x);
    const newScreenPoints = this.getNewScreenPoint(screenPoints, xPosition, yPosition, index);
    const newPoints = this.getCartesianPoints(newScreenPoints);
    this.points = newPoints;
    this.setGeometryPoints(newPoints);
    this.drawImage();
    this.updateAllDraggingPoints();
    this.updateRotationPoint();
    this.eventDispatcher.dispatchEvent('drawUpdate', this.getPoints());
  }

  getPoints() {
    return this.points;
  }
  getCenter() {
    const screenPoints = this.getScreenPoints();
    const center = {
      x: (screenPoints[0].x + screenPoints[2].x) / 2,
      y: (screenPoints[0].y + screenPoints[2].y) / 2,
    };
    const centerCartesian = this.pixelToCartesian(center);
    var cartographic = this.cesium.Cartographic.fromCartesian(centerCartesian);
    // 将弧度转换为度
    var longitude = this.cesium.Math.toDegrees(cartographic.longitude);
    var latitude = this.cesium.Math.toDegrees(cartographic.latitude);
    var height = cartographic.height; // 如果需要的话，这里也有高度
    return {
      longitude,
      latitude,
      height,
    };
  }
}
