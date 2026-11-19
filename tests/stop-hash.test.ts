import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildStopHash, isAppStopHistoryState, parseStopHash, STOP_HISTORY_MARKER } from '../lib/stop-hash';

test('parseStopHash lee el número del hash', () => {
  assert.equal(parseStopHash('#poste=104'), '104');
});

test('parseStopHash devuelve null sin hash o con hash ajeno o inválido', () => {
  assert.equal(parseStopHash(''), null);
  assert.equal(parseStopHash('#otro=1'), null);
  assert.equal(parseStopHash('#poste='), null);
  assert.equal(parseStopHash('#poste=1/2'), null);
});

test('buildStopHash y parseStopHash son inversas', () => {
  assert.equal(buildStopHash('8105'), '#poste=8105');
  assert.equal(parseStopHash(buildStopHash('8105')), '8105');
  assert.equal(buildStopHash(null), '');
});

test('isAppStopHistoryState reconoce solo la marca propia', () => {
  assert.equal(isAppStopHistoryState(STOP_HISTORY_MARKER), true);
  assert.equal(isAppStopHistoryState(null), false);
  assert.equal(isAppStopHistoryState({}), false);
  assert.equal(isAppStopHistoryState('zarabusStop'), false);
  assert.equal(isAppStopHistoryState({ zarabusStop: false }), false);
});
