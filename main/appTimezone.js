/**
 * Inside Scores always runs on America/New_York (CorrLinks subject + UI clock).
 * OS timezone does not matter — only the system clock instant is used, then shown in NY.
 */
const APP_TIMEZONE = 'America/New_York';

function getAppTimezone() {
  return APP_TIMEZONE;
}

module.exports = {
  APP_TIMEZONE,
  getAppTimezone,
};
