import * as React from "react"
import { useState, useMemo } from "react"

import clsx from "classnames"
import { makeStyles, Tooltip } from "@material-ui/core"
import Delete from "@material-ui/icons/Delete"

import {
  GA4Dimension,
  DimensionPicker,
  GA4Metric,
  MetricPicker,
} from "@/components/GA4Pickers"
import Select, { SelectOption } from "@/components/Select"
import { SAB, TooltipIconButton } from "@/components/Buttons"
import { UseFilterContext } from "../useFilter"
import {
  BaseFilter,
  UpdateFilterFn,
  FilterType,
  ExpressionPath,
  RemoveExpressionFn,
} from "../index"
import StringFilter, { MatchType } from "./StringFilter"
import NumericFilter, { OperationType } from "./NumericFilter"
import InListFilter from "./InListFilter"
import BetweenFilter from "./BetweenFilter"

export const useStyles = makeStyles(theme => ({
  indented: {
    marginLeft: theme.spacing(1),
  },
  filterType: {
    width: "15ch",
  },
  shortWidth: {
    width: "11ch",
  },
  mediumWidth: {
    width: "22ch",
  },
  bigWidth: {
    width: "33ch",
  },
  orField: {
    maxWidth: "25ch",
  },
  filter: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    "&> *:not(:first-child)": {
      marginLeft: theme.spacing(1),
    },
    "&> *": {
      marginBottom: theme.spacing(1),
    },
  },
}))

const Filter: React.FC<{
  filter: BaseFilter
  nesting: number
  dimensionFilter: (dim: GA4Dimension) => boolean
  metricFilter: (met: GA4Metric) => boolean
  updateFilter: UpdateFilterFn
  removeExpression: RemoveExpressionFn
  path: ExpressionPath
  type: FilterType
}> = ({
  filter,
  nesting,
  dimensionFilter,
  metricFilter,
  updateFilter,
  removeExpression,
  path,
  type,
}) => {
  const classes = useStyles()
  const [dimension, setDimension] = useState<GA4Dimension>()
  const [metric, setMetric] = useState<GA4Metric>()

  // When the dimension/metric name changes, update the filter.
  React.useEffect(() => {
    const field = type === "metric" ? metric : dimension
    if (filter.fieldName !== field?.apiName) {
      updateFilter(path, old => {
        return { ...old, fieldName: field?.apiName }
      })
    }
  }, [path, dimension, metric, updateFilter, filter.fieldName, type])

  const [inner, filterOption] = useMemo(() => {
    let filterOption: SelectOption | undefined = undefined
    let inner: JSX.Element | null = null
    if (filter.stringFilter !== undefined) {
      filterOption = { value: "stringFilter", displayName: "string" }
      inner = (
        <StringFilter
          stringFilter={filter.stringFilter}
          updateFilter={updateFilter}
          path={path}
        />
      )
    }
    if (filter.numericFilter !== undefined) {
      filterOption = { value: "numericFilter", displayName: "numeric" }
      inner = (
        <NumericFilter
          numericFilter={filter.numericFilter}
          updateFilter={updateFilter}
          path={path}
        />
      )
    }
    if (filter.inListFilter !== undefined) {
      filterOption = { value: "inListFilter", displayName: "in list" }
      inner = (
        <InListFilter
          inListFilter={filter.inListFilter}
          updateFilter={updateFilter}
          path={path}
        />
      )
    }
    if (filter.betweenFilter !== undefined) {
      filterOption = { value: "betweenFilter", displayName: "between" }
      inner = (
        <BetweenFilter
          betweenFilter={filter.betweenFilter}
          updateFilter={updateFilter}
          path={path}
        />
      )
    }
    return [inner, filterOption]
  }, [filter, updateFilter, path])

  const onClick = React.useCallback(() => {
    removeExpression(path)
  }, [removeExpression, path])

  const { showAdvanced } = React.useContext(UseFilterContext)!

  return (
    <section
      className={clsx(classes.filter, { [classes.indented]: nesting > 0 })}
    >
      {showAdvanced && (
        <TooltipIconButton onClick={onClick} tooltip="delete filter">
          <Delete />
        </TooltipIconButton>
      )}
      {type === "metric" ? (
        <MetricPicker
          label="metric filter"
          autoSelectIfOne={showAdvanced}
          metricFilter={metricFilter}
          setMetric={setMetric}
          className={classes.orField}
        />
      ) : (
        <DimensionPicker
          label="dimension filter"
          autoSelectIfOne={showAdvanced}
          dimensionFilter={dimensionFilter}
          setDimension={setDimension}
          className={classes.orField}
        />
      )}
      <Select
        value={filterOption}
        label="filter type"
        onChange={nu => {
          if (nu === undefined) {
            return
          }
          const value = {}
          if (nu.value === "numericFilter") {
            value["operation"] = OperationType.Equal
          }
          if (nu.value === "stringFilter") {
            value["matchType"] = MatchType.Exact
          }
          updateFilter(path, old => ({
            fieldName: old.fieldName,
            [nu.value]: value,
          }))
        }}
        className={classes.filterType}
        options={
          type === "metric"
            ? [
                { value: "numericFilter", displayName: "numeric" },
                { value: "betweenFilter", displayName: "between" },
              ]
            : [
                { value: "stringFilter", displayName: "string" },
                { value: "inListFilter", displayName: "in list" },
              ]
        }
      />
      {inner}
    </section>
  )
}

export default Filter