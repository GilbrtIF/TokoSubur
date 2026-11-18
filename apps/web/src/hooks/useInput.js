import { useState } from 'react';

function useInput(defaultValue = '') {
  const [value, setValue] = useState(defaultValue);

  const onValueChange = (event) => setValue(event.target.value);
  const reset = () => setValue(defaultValue);

  return [value, onValueChange, reset];
}

export default useInput;