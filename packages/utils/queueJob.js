// 任务缓冲队列，用来存储在本次任务执行过程中产生的任务
const queue = new Set()
// 立即resolve的promise实例
const p = Promise.resolve()
// 标识当前是否正在执行缓冲任务队列
let isFlushing = false

// 调度器的最小实现
export default function queueJob(job) {
  queue.add(job)
  if (!isFlushing) {
    isFlushing = true
    p.then(() => {
      queue.forEach(job => job())
    }).finally(() => {
      isFlushing = false
      queue.clear()
    })
  }
}
