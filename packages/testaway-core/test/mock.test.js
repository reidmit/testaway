fdescribe('mock', () => {
  describe('mock functions', () => {
    test('mock names', () => {
      const f1 = mock.func();
      expect(f1.mock.name).toBeUndefined();
      expect(`${f1}`).toBe('[MockFunction]');

      const f2 = mock.func('fun');
      expect(f2.mock.name).toBe('fun');
      expect(`${f2}`).toBe('[MockFunction fun]');
    });

    test('tracking calls', () => {
      const f = mock.func();
      expect(f).toHaveType('function');
      expect(f.mock.calls).toBeInstanceOf(Array);
      expect(f.mock.calls).toHaveLength(0);
      expect(f.mock.callCount).toBe(0);

      f(47);
      expect(f.mock.calls).toHaveLength(1);
      expect(f.mock.callCount).toBe(1);
      expect(f.mock.calls[0].args).toEqual([47]);
      expect(f.mock.lastCall.args).toEqual([47]);

      f('hello', 'world');
      expect(f.mock.calls).toHaveLength(2);
      expect(f.mock.callCount).toBe(2);
      expect(f.mock.calls[0].args).toEqual([47]);
      expect(f.mock.calls[1].args).toEqual(['hello', 'world']);
      expect(f.mock.lastCall.args).toEqual(['hello', 'world']);

      f.mock.resetCalls();
      expect(f.mock.calls).toHaveLength(0);
      expect(f.mock.lastCall).toBeUndefined();
    });

    test('default return values', () => {
      const f = mock.func();
      expect(f()).toBeUndefined();

      f.mock.returns(47);
      expect(f()).toBe(47);

      f.mock.returns('hello!');
      expect(f()).toBe('hello!');

      f.mock.reset();
      expect(f()).toBeUndefined();
    });

    test('numbered return values', () => {
      const f = mock.func();

      f.mock.onCall(1).returns(47);
      f.mock.onCall(3).returns('wow');

      expect(f()).toBeUndefined();
      expect(f()).toBe(47);
      expect(f()).toBeUndefined();
      expect(f()).toBe('wow');
      expect(f()).toBeUndefined();
      expect(f()).toBeUndefined();

      const f2 = mock.func();

      f2.mock.returns(true);
      f2.mock.onCall(1).returns(47);
      f2.mock.onCall(3).returns('wow');

      expect(f2()).toBe(true);
      expect(f2()).toBe(47);
      expect(f2()).toBe(true);
      expect(f2()).toBe('wow');
      expect(f2()).toBe(true);
      expect(f2()).toBe(true);
    });

    test('arg-based return values', () => {
      const f = mock.func();

      f.mock.onArgs().returns('no args');
      f.mock.onArgs('A').returns(47);
      f.mock.onArgs('A', 'B').returns('wow');

      expect(f()).toBe('no args');
      expect(f('something else')).toBeUndefined();
      expect(f('A')).toBe(47);
      expect(f('A', 'B')).toBe('wow');
      expect(f('A', 'B', 'C')).toBeUndefined();
    });

    test('numbered return values win over arg-based return values', () => {
      const f = mock.func();

      f.mock.onCall(0).returns('call 0');
      f.mock.onCall(2).returns('call 2');
      f.mock.onArgs(47).returns('no args');

      expect(f(47)).toBe('call 0');
      expect(f(47)).toBe('no args');
      expect(f(47)).toBe('call 2');
      expect(f(47)).toBe('no args');
    });

    test('resetting', () => {
      const f1 = mock.func();
      f1.mock.onCall(0).returns('mocked 0');
      f1.mock.onCall(1).returns('mocked 1');
      f1.mock.onCall(2).returns('mocked 2');
      expect(f1()).toBe('mocked 0');
      expect(f1()).toBe('mocked 1');

      f1.mock.reset();
      expect(f1()).toBeUndefined();

      const f2 = mock.func();
      f2.mock.onCall(0).returns('mocked 0');
      f2.mock.onCall(1).returns('mocked 1');
      f2.mock.onCall(2).returns('mocked 2');
      expect(f2()).toBe('mocked 0');
      expect(f2()).toBe('mocked 1');

      f2.mock.resetCalls();
      expect(f2()).toBe('mocked 0');
    });

    test('with setup function', () => {
      const f = mock.func(m => {
        m.returns(47);
        m.onCall(1).returns('call 1');
      });

      expect(f.mock.name).toBeUndefined();
      expect(f()).toBe(47);
      expect(f()).toBe('call 1');
      expect(f()).toBe(47);
    });

    test('with name and setup function', () => {
      const f = mock.func('myMock', m => {
        m.returns(47);
        m.onCall(1).returns('call 1');
      });

      expect(f.mock.name).toBe('myMock');
      expect(f()).toBe(47);
      expect(f()).toBe('call 1');
      expect(f()).toBe(47);
    });
  });
});