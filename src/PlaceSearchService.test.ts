
import test from 'ava';
import { mapSearchPlace } from './PlaceSearchService';

test('filter asciiname', t => {
    let sp = mapSearchPlace({ id: 1, name: 'Name', asciiname: 'Name' });
    t.is(sp.asciiname, undefined, 'Filtered asciiname===name');

    sp = mapSearchPlace({ id: 1, name: 'Name1', asciiname: 'Name' });
    t.is(sp.asciiname, 'Name', 'not Filtered asciiname!==name');
});

test('filter names', t => {
    let sp = mapSearchPlace({ id: 1, name: 'Năme', asciiname: 'Name', names: 'Name[en]|Năme[ro]' });
    t.is(sp.asciiname, 'Name', 'Filtered asciiname===name');
    t.is(sp.names, undefined, 'Filtered names===name or asciiname');

    sp = mapSearchPlace({ id: 1, name: 'Năme', asciiname: 'Name', names: 'Name[en]|Năme[ro]|Name 2[ro]' });
    t.is(sp.asciiname, 'Name', 'Filtered asciiname===name');
    t.is(sp.names.length, 1, 'Filtered names===name or asciiname');
    t.is(sp.names[0], 'Name 2', 'Not filter diff names');
});

test('filter atonic names', t => {
    const sp = mapSearchPlace({ id: 1, name: 'Năme', asciiname: 'Name', names: 'Name[en]|Năme 2[ro]' });
    t.is(sp.asciiname, 'Name', 'Filtered asciiname===name');
    t.is(sp.names.length, 1, 'Filtered names===name or asciiname');
    t.is(sp.atonic.length, 1, 'Filtered atonic===name or asciiname');
    t.is(sp.atonic[0], 'Name 2', 'Filtered atonic===name or asciiname');
});
