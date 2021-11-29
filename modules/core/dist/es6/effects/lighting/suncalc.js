const DEGREES_TO_RADIANS = Math.PI / 180;
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const JD1970 = 2440588;
const JD2000 = 2451545;
const e = DEGREES_TO_RADIANS * 23.4397;
const M0 = 357.5291;
const M1 = 0.98560028;
const THETA0 = 280.147;
const THETA1 = 360.9856235;
export function getSolarPosition(timestamp, latitude, longitude) {
  const longitudeWestInRadians = DEGREES_TO_RADIANS * -longitude;
  const phi = DEGREES_TO_RADIANS * latitude;
  const d = toDays(timestamp);
  const c = getSunCoords(d);
  const H = getSiderealTime(d, longitudeWestInRadians) - c.rightAscension;
  return {
    azimuth: getAzimuth(H, phi, c.declination),
    altitude: getAltitude(H, phi, c.declination)
  };
}
export function getSunlightDirection(timestamp, latitude, longitude) {
  const _getSolarPosition = getSolarPosition(timestamp, latitude, longitude),
        azimuth = _getSolarPosition.azimuth,
        altitude = _getSolarPosition.altitude;

  const azimuthN = azimuth + Math.PI;
  return [-Math.sin(azimuthN), -Math.cos(azimuthN), -Math.sin(altitude)];
}

function toJulianDay(timestamp) {
  return timestamp / DAY_IN_MS - 0.5 + JD1970;
}

function toDays(timestamp) {
  return toJulianDay(timestamp) - JD2000;
}

function getRightAscension(eclipticLongitude, b) {
  const lambda = eclipticLongitude;
  return Math.atan2(Math.sin(lambda) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(lambda));
}

function getDeclination(eclipticLongitude, b) {
  const lambda = eclipticLongitude;
  return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(lambda));
}

function getAzimuth(hourAngle, latitudeInRadians, declination) {
  const H = hourAngle;
  const phi = latitudeInRadians;
  const delta = declination;
  return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi));
}

function getAltitude(hourAngle, latitudeInRadians, declination) {
  const H = hourAngle;
  const phi = latitudeInRadians;
  const delta = declination;
  return Math.asin(Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H));
}

function getSiderealTime(dates, longitudeWestInRadians) {
  return DEGREES_TO_RADIANS * (THETA0 + THETA1 * dates) - longitudeWestInRadians;
}

function getSolarMeanAnomaly(days) {
  return DEGREES_TO_RADIANS * (M0 + M1 * days);
}

function getEclipticLongitude(meanAnomaly) {
  const M = meanAnomaly;
  const C = DEGREES_TO_RADIANS * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = DEGREES_TO_RADIANS * 102.9372;
  return M + C + P + Math.PI;
}

function getSunCoords(dates) {
  const M = getSolarMeanAnomaly(dates);
  const L = getEclipticLongitude(M);
  return {
    declination: getDeclination(L, 0),
    rightAscension: getRightAscension(L, 0)
  };
}
//# sourceMappingURL=suncalc.js.map