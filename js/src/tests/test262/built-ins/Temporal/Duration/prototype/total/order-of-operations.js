// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.duration.prototype.total
description: Properties on objects passed to total() are accessed in the correct order
includes: [compareArray.js, temporalHelpers.js]
features: [Temporal]
---*/

const expected = [
  "get options.relativeTo",
  "get options.unit",
  "get options.unit.toString",
  "call options.unit.toString",
];
const actual = [];

function createOptionsObserver({ unit = "nanoseconds", roundingMode = "halfExpand", roundingIncrement = 1, relativeTo = undefined } = {}) {
  return TemporalHelpers.propertyBagObserver(actual, {
    unit,
    roundingMode,
    roundingIncrement,
    relativeTo,
  }, "options");
}

const instance = new Temporal.Duration(0, 0, 0, 0, 2400);

// basic order of observable operations, with no relativeTo
instance.total(createOptionsObserver({ unit: "nanoseconds" }));
assert.compareArray(actual, expected, "order of operations");
actual.splice(0); // clear

const expectedOpsForPlainRelativeTo = [
  // ToRelativeTemporalObject
  "get options.relativeTo",
  "get options.relativeTo.calendar",
  "has options.relativeTo.calendar.dateAdd",
  "has options.relativeTo.calendar.dateFromFields",
  "has options.relativeTo.calendar.dateUntil",
  "has options.relativeTo.calendar.day",
  "has options.relativeTo.calendar.dayOfWeek",
  "has options.relativeTo.calendar.dayOfYear",
  "has options.relativeTo.calendar.daysInMonth",
  "has options.relativeTo.calendar.daysInWeek",
  "has options.relativeTo.calendar.daysInYear",
  "has options.relativeTo.calendar.fields",
  "has options.relativeTo.calendar.id",
  "has options.relativeTo.calendar.inLeapYear",
  "has options.relativeTo.calendar.mergeFields",
  "has options.relativeTo.calendar.month",
  "has options.relativeTo.calendar.monthCode",
  "has options.relativeTo.calendar.monthDayFromFields",
  "has options.relativeTo.calendar.monthsInYear",
  "has options.relativeTo.calendar.weekOfYear",
  "has options.relativeTo.calendar.year",
  "has options.relativeTo.calendar.yearMonthFromFields",
  "has options.relativeTo.calendar.yearOfWeek",
  "get options.relativeTo.calendar.dateFromFields",
  "get options.relativeTo.calendar.fields",
  "call options.relativeTo.calendar.fields",
  "get options.relativeTo.day",
  "get options.relativeTo.day.valueOf",
  "call options.relativeTo.day.valueOf",
  "get options.relativeTo.hour",
  "get options.relativeTo.microsecond",
  "get options.relativeTo.millisecond",
  "get options.relativeTo.minute",
  "get options.relativeTo.month",
  "get options.relativeTo.month.valueOf",
  "call options.relativeTo.month.valueOf",
  "get options.relativeTo.monthCode",
  "get options.relativeTo.monthCode.toString",
  "call options.relativeTo.monthCode.toString",
  "get options.relativeTo.nanosecond",
  "get options.relativeTo.offset",
  "get options.relativeTo.second",
  "get options.relativeTo.timeZone",
  "get options.relativeTo.year",
  "get options.relativeTo.year.valueOf",
  "call options.relativeTo.year.valueOf",
  "call options.relativeTo.calendar.dateFromFields",
  // GetTemporalUnit
  "get options.unit",
  "get options.unit.toString",
  "call options.unit.toString",
  // lookup in Duration.p.total
  "get options.relativeTo.calendar.dateAdd",
  "get options.relativeTo.calendar.dateUntil",
];

const plainRelativeTo = TemporalHelpers.propertyBagObserver(actual, {
  year: 2001,
  month: 5,
  monthCode: "M05",
  day: 2,
  calendar: TemporalHelpers.calendarObserver(actual, "options.relativeTo.calendar"),
}, "options.relativeTo");

// basic order of observable operations, without rounding:
instance.total(createOptionsObserver({ unit: "nanoseconds", relativeTo: plainRelativeTo }));
assert.compareArray(actual, expectedOpsForPlainRelativeTo, "order of operations for PlainDate relativeTo");
actual.splice(0); // clear

// code path through RoundDuration that rounds to the nearest year with minimal calendar calls:
const expectedOpsForMinimalYearRounding = expectedOpsForPlainRelativeTo.concat([
  // DifferencePlainDateTimeWithRounding -> DifferenceISODateTime
  "call options.relativeTo.calendar.dateUntil",
  "call options.relativeTo.calendar.dateAdd",
]);
instance.total(createOptionsObserver({ unit: "years", relativeTo: plainRelativeTo }));
assert.compareArray(actual, expectedOpsForMinimalYearRounding, "order of operations with years = 0 and unit = years");
actual.splice(0); // clear

// code path through Duration.p.total that rounds to the nearest year:
const expectedOpsForYearRounding = expectedOpsForPlainRelativeTo.concat([
  "call options.relativeTo.calendar.dateAdd",    // Duration.p.total 19.c
  // DifferencePlainDateTimeWithRounding
  "call options.relativeTo.calendar.dateUntil",  // 5
  // RoundRelativeDuration
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.calendar.dateAdd",
]);
const instanceYears = new Temporal.Duration(1, 12, 0, 0, /* hours = */ 2400);
instanceYears.total(createOptionsObserver({ unit: "years", relativeTo: plainRelativeTo }));
assert.compareArray(actual, expectedOpsForYearRounding, "order of operations with unit = years");
actual.splice(0); // clear

// code path through Duration.prototype.total that rounds to the nearest month:
const expectedOpsForMonthRounding = expectedOpsForPlainRelativeTo.concat([
  "call options.relativeTo.calendar.dateAdd",    // Duration.p.total 19.c
  // DifferencePlainDateTimeWithRounding
  "call options.relativeTo.calendar.dateUntil",  // 5
  // RoundRelativeDuration
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.calendar.dateAdd",
]);
const instance2 = new Temporal.Duration(1, 0, 0, 62);
instance2.total(createOptionsObserver({ unit: "months", relativeTo: plainRelativeTo }));
assert.compareArray(actual, expectedOpsForMonthRounding, "order of operations with unit = months");
actual.splice(0); // clear

// code path through Duration.prototype.total that rounds to the nearest week:
const expectedOpsForWeekRounding = expectedOpsForPlainRelativeTo.concat([
  "call options.relativeTo.calendar.dateAdd",    // Duration.p.total 19.c
  // DifferencePlainDateTimeWithRounding
  "call options.relativeTo.calendar.dateUntil",  // 5
  // RoundRelativeDuration
  "call options.relativeTo.calendar.dateUntil",
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.calendar.dateAdd",
]);
const instance3 = new Temporal.Duration(1, 1, 0, 15);
instance3.total(createOptionsObserver({ unit: "weeks", relativeTo: plainRelativeTo }));
assert.compareArray(actual, expectedOpsForWeekRounding, "order of operations with unit = weeks");
actual.splice(0); // clear

// code path through UnbalanceDateDurationRelative that rounds to the nearest day:
const expectedOpsForDayRounding = expectedOpsForPlainRelativeTo.concat([
  "call options.relativeTo.calendar.dateAdd",  // 10
]);
const instance4 = new Temporal.Duration(1, 1, 1)
instance4.total(createOptionsObserver({ unit: "days", relativeTo: plainRelativeTo }));
assert.compareArray(actual, expectedOpsForDayRounding, "order of operations with unit = days");
actual.splice(0);  // clear

const expectedOpsForZonedRelativeTo = [
  // ToRelativeTemporalObject
  "get options.relativeTo",
  "get options.relativeTo.calendar",
  "has options.relativeTo.calendar.dateAdd",
  "has options.relativeTo.calendar.dateFromFields",
  "has options.relativeTo.calendar.dateUntil",
  "has options.relativeTo.calendar.day",
  "has options.relativeTo.calendar.dayOfWeek",
  "has options.relativeTo.calendar.dayOfYear",
  "has options.relativeTo.calendar.daysInMonth",
  "has options.relativeTo.calendar.daysInWeek",
  "has options.relativeTo.calendar.daysInYear",
  "has options.relativeTo.calendar.fields",
  "has options.relativeTo.calendar.id",
  "has options.relativeTo.calendar.inLeapYear",
  "has options.relativeTo.calendar.mergeFields",
  "has options.relativeTo.calendar.month",
  "has options.relativeTo.calendar.monthCode",
  "has options.relativeTo.calendar.monthDayFromFields",
  "has options.relativeTo.calendar.monthsInYear",
  "has options.relativeTo.calendar.weekOfYear",
  "has options.relativeTo.calendar.year",
  "has options.relativeTo.calendar.yearMonthFromFields",
  "has options.relativeTo.calendar.yearOfWeek",
  "get options.relativeTo.calendar.dateFromFields",
  "get options.relativeTo.calendar.fields",
  "call options.relativeTo.calendar.fields",
  "get options.relativeTo.day",
  "get options.relativeTo.day.valueOf",
  "call options.relativeTo.day.valueOf",
  "get options.relativeTo.hour",
  "get options.relativeTo.hour.valueOf",
  "call options.relativeTo.hour.valueOf",
  "get options.relativeTo.microsecond",
  "get options.relativeTo.microsecond.valueOf",
  "call options.relativeTo.microsecond.valueOf",
  "get options.relativeTo.millisecond",
  "get options.relativeTo.millisecond.valueOf",
  "call options.relativeTo.millisecond.valueOf",
  "get options.relativeTo.minute",
  "get options.relativeTo.minute.valueOf",
  "call options.relativeTo.minute.valueOf",
  "get options.relativeTo.month",
  "get options.relativeTo.month.valueOf",
  "call options.relativeTo.month.valueOf",
  "get options.relativeTo.monthCode",
  "get options.relativeTo.monthCode.toString",
  "call options.relativeTo.monthCode.toString",
  "get options.relativeTo.nanosecond",
  "get options.relativeTo.nanosecond.valueOf",
  "call options.relativeTo.nanosecond.valueOf",
  "get options.relativeTo.offset",
  "get options.relativeTo.offset.toString",
  "call options.relativeTo.offset.toString",
  "get options.relativeTo.second",
  "get options.relativeTo.second.valueOf",
  "call options.relativeTo.second.valueOf",
  "get options.relativeTo.timeZone",
  "get options.relativeTo.year",
  "get options.relativeTo.year.valueOf",
  "call options.relativeTo.year.valueOf",
  "call options.relativeTo.calendar.dateFromFields",
  "has options.relativeTo.timeZone.getOffsetNanosecondsFor",
  "has options.relativeTo.timeZone.getPossibleInstantsFor",
  "has options.relativeTo.timeZone.id",
  "get options.relativeTo.timeZone.getOffsetNanosecondsFor",
  "get options.relativeTo.timeZone.getPossibleInstantsFor",
  // InterpretISODateTimeOffset
  "call options.relativeTo.timeZone.getPossibleInstantsFor",
  "call options.relativeTo.timeZone.getOffsetNanosecondsFor",
  // GetTemporalUnit
  "get options.unit",
  "get options.unit.toString",
  "call options.unit.toString",
];

const zonedRelativeTo = TemporalHelpers.propertyBagObserver(actual, {
  year: 2001,
  month: 5,
  monthCode: "M05",
  day: 2,
  hour: 6,
  minute: 54,
  second: 32,
  millisecond: 987,
  microsecond: 654,
  nanosecond: 321,
  offset: "+00:00",
  calendar: TemporalHelpers.calendarObserver(actual, "options.relativeTo.calendar"),
  timeZone: TemporalHelpers.timeZoneObserver(actual, "options.relativeTo.timeZone"),
}, "options.relativeTo");

// basic order of observable operations, without rounding:
instance.total(createOptionsObserver({ unit: "nanoseconds", relativeTo: zonedRelativeTo }));
assert.compareArray(actual, expectedOpsForZonedRelativeTo.concat([
  "get options.relativeTo.calendar.dateAdd",
  "get options.relativeTo.calendar.dateUntil",
]), "order of operations for ZonedDateTime relativeTo");
actual.splice(0); // clear

// code path through Duration.p.total that rounds to the nearest year with
// minimal calendar operations:
const expectedOpsForMinimalYearRoundingZoned = expectedOpsForZonedRelativeTo.concat([
  // ToTemporalDate
  "call options.relativeTo.timeZone.getOffsetNanosecondsFor",
  // lookup in Duration.p.total
  "get options.relativeTo.calendar.dateAdd",
  "get options.relativeTo.calendar.dateUntil",
  // DifferenceZonedDateTimeWithRounding → DifferenceZonedDateTime
  "call options.relativeTo.timeZone.getOffsetNanosecondsFor",  // 5
  "call options.relativeTo.timeZone.getPossibleInstantsFor",   // 12.c
  "call options.relativeTo.calendar.dateUntil",                // 13.f
  // RoundRelativeDuration
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",
]);
instance.total(createOptionsObserver({ unit: "years", relativeTo: zonedRelativeTo }));
assert.compareArray(
  actual,
  expectedOpsForMinimalYearRoundingZoned,
  "order of operations with years = 0, unit = years and ZonedDateTime relativeTo"
);
actual.splice(0); // clear

// code path through Duration.p.total that rounds to years:
const expectedOpsForYearRoundingZoned = expectedOpsForZonedRelativeTo.concat([
  // ToTemporalDate
  "call options.relativeTo.timeZone.getOffsetNanosecondsFor",
  // lookup in Duration.p.total
  "get options.relativeTo.calendar.dateAdd",
  "get options.relativeTo.calendar.dateUntil",
  // 18.c AddZonedDateTime
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",   // 13. GetInstantFor
  // DifferenceZonedDateTimeWithRounding → DifferenceZonedDateTime
  "call options.relativeTo.timeZone.getOffsetNanosecondsFor",  // 5
  "call options.relativeTo.timeZone.getPossibleInstantsFor",   // 12.c
  "call options.relativeTo.calendar.dateUntil",                // 13.f
  // RoundRelativeDuration
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",
]);
instanceYears.total(createOptionsObserver({ unit: "years", relativeTo: zonedRelativeTo }));
assert.compareArray(
  actual,
  expectedOpsForYearRoundingZoned,
  "order of operations with unit = years and ZonedDateTime relativeTo"
);
actual.splice(0); // clear

// code path through Duration.p.total that rounds to months:
const expectedOpsForMonthsRoundingZoned = expectedOpsForZonedRelativeTo.concat([
  // ToTemporalDate
  "call options.relativeTo.timeZone.getOffsetNanosecondsFor",
  // lookup in Duration.p.total
  "get options.relativeTo.calendar.dateAdd",
  "get options.relativeTo.calendar.dateUntil",
  // 18.c AddZonedDateTime
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",   // 13. GetInstantFor
  // DifferenceZonedDateTimeWithRounding → DifferenceZonedDateTime
  "call options.relativeTo.timeZone.getOffsetNanosecondsFor",  // 5
  "call options.relativeTo.timeZone.getPossibleInstantsFor",   // 12.c
  "call options.relativeTo.calendar.dateUntil",                // 13.f
  // RoundRelativeDuration
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",
]);
new Temporal.Duration(0, 1, 1).total(createOptionsObserver({ unit: "months", relativeTo: zonedRelativeTo }));
assert.compareArray(
  actual,
  expectedOpsForMonthsRoundingZoned,
  "order of operations with unit = months and ZonedDateTime relativeTo"
);
actual.splice(0); // clear

// code path through Duration.p.total that rounds to weeks:
const expectedOpsForWeeksRoundingZoned = expectedOpsForZonedRelativeTo.concat([
  // ToTemporalDate
  "call options.relativeTo.timeZone.getOffsetNanosecondsFor",
  // lookup in Duration.p.total
  "get options.relativeTo.calendar.dateAdd",
  "get options.relativeTo.calendar.dateUntil",
  // 18.c AddZonedDateTime
  "call options.relativeTo.timeZone.getPossibleInstantsFor",   // 13. GetInstantFor
  // DifferenceZonedDateTimeWithRounding → DifferenceZonedDateTime
  "call options.relativeTo.timeZone.getOffsetNanosecondsFor",  // 5
  "call options.relativeTo.timeZone.getPossibleInstantsFor",   // 12.c
  "call options.relativeTo.calendar.dateUntil",                // 13.f
  // RoundRelativeDuration
  "call options.relativeTo.calendar.dateUntil",
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.calendar.dateAdd",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",
  "call options.relativeTo.timeZone.getPossibleInstantsFor",
]);
new Temporal.Duration(0, 0, 0, 1, 240).total(createOptionsObserver({ unit: "weeks", relativeTo: zonedRelativeTo }));
assert.compareArray(
  actual,
  expectedOpsForWeeksRoundingZoned,
  "order of operations with unit = weeks and no calendar units"
);
actual.splice(0);  // clear

reportCompare(0, 0);
