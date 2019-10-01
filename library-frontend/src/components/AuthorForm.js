import React, { useState } from 'react'

const AuthorForm = (props) => {
  const [name, setName] = useState('')
  const [bornStr, setBornStr] = useState('')

  const submit = async (event) => {
    event.preventDefault()

    const born = parseInt(bornStr)

    await props.editAuthor({ variables: { name, born }})
    setName('')
    setBornStr('')
  }

  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>Edit Author Birthyear</h2>
      <form onSubmit={submit}>
        <div>
          name
          <input 
            value={name}
            onChange={({target}) => setName(target.value)}
          />
        </div>
        <div>
          born
          <input 
            value={bornStr} 
            onChange={({target}) => setBornStr(target.value)} 
          />
        </div>
        <button type='submit'>Edit Birthday</button>
      </form>
    </div>
  )
}

export default AuthorForm