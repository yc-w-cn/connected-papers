import { describe, it, expect } from '@jest/globals';
import { cn } from './utils';

describe('cn 工具函数', () => {
  it('应该正确合并类名', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('应该处理条件类名', () => {
    const result = cn('class1', false && 'class2', 'class3');
    expect(result).toBe('class1 class3');
  });

  it('应该处理对象形式', () => {
    const result = cn({ class1: true, class2: false });
    expect(result).toBe('class1');
  });

  it('应该处理数组形式', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toBe('class1 class2');
  });

  it('应该处理空输入', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('应该处理混合输入', () => {
    const result = cn('class1', { class2: true }, ['class3']);
    expect(result).toBe('class1 class2 class3');
  });

  it('应该去重类名', () => {
    const result = cn('class1', 'class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('应该处理 null 和 undefined', () => {
    const result = cn('class1', null, undefined, 'class2');
    expect(result).toBe('class1 class2');
  });
});
