export default function Button({ variant='primary', className='', children, ...props }){
  const base = 'btn '
  const v = variant==='primary' ? 'btn-primary' : variant==='secondary' ? 'btn-secondary' : 'btn-tertiary'
  return <button className={base+v+(className?' '+className:'')} {...props}>{children}</button>
}
