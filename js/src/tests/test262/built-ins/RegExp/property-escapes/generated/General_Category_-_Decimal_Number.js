// Copyright 2024 Mathias Bynens. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
author: Mathias Bynens
description: >
  Unicode property escapes for `General_Category=Decimal_Number`
info: |
  Generated by https://github.com/mathiasbynens/unicode-property-escapes-tests
  Unicode v15.1.0
esid: sec-static-semantics-unicodematchproperty-p
features: [regexp-unicode-property-escapes]
includes: [regExpUtils.js]
---*/

const matchSymbols = buildString({
  loneCodePoints: [],
  ranges: [
    [0x000030, 0x000039],
    [0x000660, 0x000669],
    [0x0006F0, 0x0006F9],
    [0x0007C0, 0x0007C9],
    [0x000966, 0x00096F],
    [0x0009E6, 0x0009EF],
    [0x000A66, 0x000A6F],
    [0x000AE6, 0x000AEF],
    [0x000B66, 0x000B6F],
    [0x000BE6, 0x000BEF],
    [0x000C66, 0x000C6F],
    [0x000CE6, 0x000CEF],
    [0x000D66, 0x000D6F],
    [0x000DE6, 0x000DEF],
    [0x000E50, 0x000E59],
    [0x000ED0, 0x000ED9],
    [0x000F20, 0x000F29],
    [0x001040, 0x001049],
    [0x001090, 0x001099],
    [0x0017E0, 0x0017E9],
    [0x001810, 0x001819],
    [0x001946, 0x00194F],
    [0x0019D0, 0x0019D9],
    [0x001A80, 0x001A89],
    [0x001A90, 0x001A99],
    [0x001B50, 0x001B59],
    [0x001BB0, 0x001BB9],
    [0x001C40, 0x001C49],
    [0x001C50, 0x001C59],
    [0x00A620, 0x00A629],
    [0x00A8D0, 0x00A8D9],
    [0x00A900, 0x00A909],
    [0x00A9D0, 0x00A9D9],
    [0x00A9F0, 0x00A9F9],
    [0x00AA50, 0x00AA59],
    [0x00ABF0, 0x00ABF9],
    [0x00FF10, 0x00FF19],
    [0x0104A0, 0x0104A9],
    [0x010D30, 0x010D39],
    [0x011066, 0x01106F],
    [0x0110F0, 0x0110F9],
    [0x011136, 0x01113F],
    [0x0111D0, 0x0111D9],
    [0x0112F0, 0x0112F9],
    [0x011450, 0x011459],
    [0x0114D0, 0x0114D9],
    [0x011650, 0x011659],
    [0x0116C0, 0x0116C9],
    [0x011730, 0x011739],
    [0x0118E0, 0x0118E9],
    [0x011950, 0x011959],
    [0x011C50, 0x011C59],
    [0x011D50, 0x011D59],
    [0x011DA0, 0x011DA9],
    [0x011F50, 0x011F59],
    [0x016A60, 0x016A69],
    [0x016AC0, 0x016AC9],
    [0x016B50, 0x016B59],
    [0x01D7CE, 0x01D7FF],
    [0x01E140, 0x01E149],
    [0x01E2F0, 0x01E2F9],
    [0x01E4F0, 0x01E4F9],
    [0x01E950, 0x01E959],
    [0x01FBF0, 0x01FBF9]
  ]
});
testPropertyEscapes(
  /^\p{General_Category=Decimal_Number}+$/u,
  matchSymbols,
  "\\p{General_Category=Decimal_Number}"
);
testPropertyEscapes(
  /^\p{General_Category=Nd}+$/u,
  matchSymbols,
  "\\p{General_Category=Nd}"
);
testPropertyEscapes(
  /^\p{General_Category=digit}+$/u,
  matchSymbols,
  "\\p{General_Category=digit}"
);
testPropertyEscapes(
  /^\p{gc=Decimal_Number}+$/u,
  matchSymbols,
  "\\p{gc=Decimal_Number}"
);
testPropertyEscapes(
  /^\p{gc=Nd}+$/u,
  matchSymbols,
  "\\p{gc=Nd}"
);
testPropertyEscapes(
  /^\p{gc=digit}+$/u,
  matchSymbols,
  "\\p{gc=digit}"
);
testPropertyEscapes(
  /^\p{Decimal_Number}+$/u,
  matchSymbols,
  "\\p{Decimal_Number}"
);
testPropertyEscapes(
  /^\p{Nd}+$/u,
  matchSymbols,
  "\\p{Nd}"
);
testPropertyEscapes(
  /^\p{digit}+$/u,
  matchSymbols,
  "\\p{digit}"
);

const nonMatchSymbols = buildString({
  loneCodePoints: [],
  ranges: [
    [0x00DC00, 0x00DFFF],
    [0x000000, 0x00002F],
    [0x00003A, 0x00065F],
    [0x00066A, 0x0006EF],
    [0x0006FA, 0x0007BF],
    [0x0007CA, 0x000965],
    [0x000970, 0x0009E5],
    [0x0009F0, 0x000A65],
    [0x000A70, 0x000AE5],
    [0x000AF0, 0x000B65],
    [0x000B70, 0x000BE5],
    [0x000BF0, 0x000C65],
    [0x000C70, 0x000CE5],
    [0x000CF0, 0x000D65],
    [0x000D70, 0x000DE5],
    [0x000DF0, 0x000E4F],
    [0x000E5A, 0x000ECF],
    [0x000EDA, 0x000F1F],
    [0x000F2A, 0x00103F],
    [0x00104A, 0x00108F],
    [0x00109A, 0x0017DF],
    [0x0017EA, 0x00180F],
    [0x00181A, 0x001945],
    [0x001950, 0x0019CF],
    [0x0019DA, 0x001A7F],
    [0x001A8A, 0x001A8F],
    [0x001A9A, 0x001B4F],
    [0x001B5A, 0x001BAF],
    [0x001BBA, 0x001C3F],
    [0x001C4A, 0x001C4F],
    [0x001C5A, 0x00A61F],
    [0x00A62A, 0x00A8CF],
    [0x00A8DA, 0x00A8FF],
    [0x00A90A, 0x00A9CF],
    [0x00A9DA, 0x00A9EF],
    [0x00A9FA, 0x00AA4F],
    [0x00AA5A, 0x00ABEF],
    [0x00ABFA, 0x00DBFF],
    [0x00E000, 0x00FF0F],
    [0x00FF1A, 0x01049F],
    [0x0104AA, 0x010D2F],
    [0x010D3A, 0x011065],
    [0x011070, 0x0110EF],
    [0x0110FA, 0x011135],
    [0x011140, 0x0111CF],
    [0x0111DA, 0x0112EF],
    [0x0112FA, 0x01144F],
    [0x01145A, 0x0114CF],
    [0x0114DA, 0x01164F],
    [0x01165A, 0x0116BF],
    [0x0116CA, 0x01172F],
    [0x01173A, 0x0118DF],
    [0x0118EA, 0x01194F],
    [0x01195A, 0x011C4F],
    [0x011C5A, 0x011D4F],
    [0x011D5A, 0x011D9F],
    [0x011DAA, 0x011F4F],
    [0x011F5A, 0x016A5F],
    [0x016A6A, 0x016ABF],
    [0x016ACA, 0x016B4F],
    [0x016B5A, 0x01D7CD],
    [0x01D800, 0x01E13F],
    [0x01E14A, 0x01E2EF],
    [0x01E2FA, 0x01E4EF],
    [0x01E4FA, 0x01E94F],
    [0x01E95A, 0x01FBEF],
    [0x01FBFA, 0x10FFFF]
  ]
});
testPropertyEscapes(
  /^\P{General_Category=Decimal_Number}+$/u,
  nonMatchSymbols,
  "\\P{General_Category=Decimal_Number}"
);
testPropertyEscapes(
  /^\P{General_Category=Nd}+$/u,
  nonMatchSymbols,
  "\\P{General_Category=Nd}"
);
testPropertyEscapes(
  /^\P{General_Category=digit}+$/u,
  nonMatchSymbols,
  "\\P{General_Category=digit}"
);
testPropertyEscapes(
  /^\P{gc=Decimal_Number}+$/u,
  nonMatchSymbols,
  "\\P{gc=Decimal_Number}"
);
testPropertyEscapes(
  /^\P{gc=Nd}+$/u,
  nonMatchSymbols,
  "\\P{gc=Nd}"
);
testPropertyEscapes(
  /^\P{gc=digit}+$/u,
  nonMatchSymbols,
  "\\P{gc=digit}"
);
testPropertyEscapes(
  /^\P{Decimal_Number}+$/u,
  nonMatchSymbols,
  "\\P{Decimal_Number}"
);
testPropertyEscapes(
  /^\P{Nd}+$/u,
  nonMatchSymbols,
  "\\P{Nd}"
);
testPropertyEscapes(
  /^\P{digit}+$/u,
  nonMatchSymbols,
  "\\P{digit}"
);

reportCompare(0, 0);
