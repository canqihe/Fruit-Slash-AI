import { Point } from '../types';

export const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Check if a line segment (p1-p2) intersects with a circle (c, radius)
export const lineIntersectsCircle = (p1: Point, p2: Point, cx: number, cy: number, r: number): boolean => {
  // Check if either point is inside (basic check)
  if (distance(p1.x, p1.y, cx, cy) < r || distance(p2.x, p2.y, cx, cy) < r) return true;

  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;

  const len = distance(x1, y1, x2, y2);
  if (len === 0) return false;

  // Dot product to find closest point on line to circle center
  const dot = ((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / (len * len);

  // Closest point is roughly closest * len along the line
  const closestX = x1 + (dot * (x2 - x1));
  const closestY = y1 + (dot * (y2 - y1));

  // Check if closest point is actually on the segment
  const onSegment = dot >= 0 && dot <= 1;

  if (!onSegment) return false;

  const distToLine = distance(closestX, closestY, cx, cy);
  return distToLine < r;
};

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const randomEnum = <T extends object>(anEnum: T): T[keyof T] => {
  const enumValues = Object.keys(anEnum) as Array<keyof T>;
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return anEnum[enumValues[randomIndex]];
};