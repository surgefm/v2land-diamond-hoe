export interface PriorityQueueOptions<inputType> {
  priority?: number;
  validate?: (input: inputType) => boolean;
}

class Node<valueType, inputType> {
  value: valueType;
  next: Node<valueType, inputType> = null;
  priority = 1;
  validate: ((input?: inputType) => boolean) = () => true;

  constructor(value: valueType, options: PriorityQueueOptions<inputType> = {}) {
    this.value = value;
    if (typeof options.priority !== 'undefined') {
      this.priority = options.priority;
    }
    if (typeof options.validate !== 'undefined') {
      this.validate = options.validate;
    }
  }
}

export class PriorityQueue<valueType, inputType> {
  first: Node<valueType, inputType> = null;
  last: Node<valueType, inputType> = null;
  length = 0;

  push(value: valueType, options: PriorityQueueOptions<inputType> = {}): void {
    const node = new Node<valueType, inputType>(value, options);

    if (this.last === null) {
      this.first = node;
      this.last = node;
    } else if (typeof options.priority === 'undefined') {
      this.last.next = node;
      this.last = node;
    } else if (node.priority > this.first.priority) {
      node.next = this.first;
      this.first = node;
    } else {
      let previous = this.first;
      while (previous.next !== null && previous.next.priority >= node.priority) {
        previous = previous.next;
      }
      node.next = previous.next;
      previous.next = node;
    }

    this.length++;
    return;
  }

  poll(input?: inputType): valueType {
    let previous: Node<valueType, inputType> = null;
    let node = this.first;

    while (node !== null) {
      if (node.validate(input)) {
        if (previous !== null) {
          previous.next = node.next;
        } else {
          this.first = node.next;
        }

        if (node === this.last) this.last = previous;

        const value = node.value;
        node = null;
        return value;
      }

      previous = node;
      node = node.next;
    }

    return null;
  }
}
