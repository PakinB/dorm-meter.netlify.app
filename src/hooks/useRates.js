import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRates() {
  const [waterRate, setWaterRate] = useState(35)
  const [elecRate,  setElecRate]  = useState(9)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { fetchRates() }, [])

  async function fetchRates() {
    const { data } = await supabase
      .from('settings')
      .select('key, value')

    if (data) {
      const water = data.find((r) => r.key === 'water_rate')
      const elec  = data.find((r) => r.key === 'elec_rate')
      if (water) setWaterRate(water.value)
      if (elec)  setElecRate(elec.value)
    }
    setLoading(false)
  }

  return { waterRate, elecRate, loading }
}