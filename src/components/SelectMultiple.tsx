import React from "react"
import Autocomplete from "@material-ui/lab/Autocomplete"
import { TextField } from "@material-ui/core"
import { isServerSide } from "../hooks"

interface SelectMultipleProps<T> {
  options: T[]
  getOptionLabel: (t: T) => string
  renderOption: (t: T) => JSX.Element | string
  onSelectedChanged: (t: T[]) => void
  label: string
  helperText: string
  serializer: (t: T[]) => { serialized: string; key: string }
  deserializer: (t: string) => T[]
  required?: true
}

const SelectMultiple = <T extends object>({
  getOptionLabel,
  options,
  renderOption,
  onSelectedChanged,
  label,
  helperText,
  serializer,
  deserializer,
  required,
}: SelectMultipleProps<T>) => {
  // TODO - maybe this should also store the available options locally and not
  // just the selected options?
  const [selectedOptions, setSelectedOptions] = React.useState<T[]>(() => {
    const { key } = serializer([])
    const asString =
      typeof window === "undefined" ? null : window.localStorage.getItem(key)
    if (asString === null) {
      return []
    } else {
      return deserializer(asString)
    }
  })

  React.useEffect(() => {
    // Store value in localStorage.
    const { key, serialized } = serializer(selectedOptions)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, serialized)
    }

    onSelectedChanged(selectedOptions)
    // TODO - This is missing the serializer dep, but in order for that to work
    // it'd need to be wrapped in useCallback which isn't a refactor I want to
    // do right now.
  }, [selectedOptions])

  if (isServerSide()) {
    return <div></div>
  }

  return (
    <Autocomplete<T, true, undefined, true>
      fullWidth
      autoComplete
      autoHighlight
      freeSolo
      multiple
      options={options}
      getOptionLabel={getOptionLabel}
      value={selectedOptions}
      onChange={(_event, value, _state) => setSelectedOptions(value as T[])}
      renderOption={renderOption}
      renderInput={params => (
        <TextField
          {...params}
          required={required}
          label={label}
          helperText={helperText}
          size="small"
          variant="outlined"
        />
      )}
    />
  )
}

export default SelectMultiple