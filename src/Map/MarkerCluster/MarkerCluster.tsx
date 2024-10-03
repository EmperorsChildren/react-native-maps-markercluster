import React from 'react'
import { Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native'
import Supercluster from 'supercluster'

import { useMapView } from '../MapView'
import {
  calculateBBox,
  isMarker,
  markerToGeoJSONFeature,
  returnMapZoom,
} from '../MapView/helpers'
import { MarkerClusterType } from '../types'
import { MarkerClusterItem } from './MarkerClusterItem'

// https://reactnative.dev/docs/0.74/layoutanimation
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export const MarkerCluster: React.FC<MarkerClusterType.WrapperProps> =
  React.memo(
    ({
      animationEnabled = true,
      children,
      clusterBackgroundColor,
      clusterFontFamily,
      clusterTextColor,
      clusterWrapperBackgroundColor,
      clusteringEnabled = true,
      edgePadding = { top: 50, left: 50, right: 50, bottom: 50 },
      extent = 512,
      layoutAnimationConf = LayoutAnimation.Presets.spring,
      maxZoom = 16,
      minPoints = 2,
      minZoom = 0,
      nodeSize = 64,
      onMarkersChange = () => {},
      onPressCluster = () => {},
      preserveClusterPressBehavior = false,
      radius = Dimensions.get('window').width * 0.06,
      renderCluster: renderClusterProp,
      selectedClusterColor,
      selectedClusterId,
      spiderLineColor = '#FF0000',
      spiralEnabled = true,
      tracksViewChanges = false,
    }) => {
      const { region, mapRef } = useMapView()

      const [clusters, setClusters] = React.useState<
        MarkerClusterType.Cluster[]
      >([])
      const superClusterRef = React.useRef<Supercluster | undefined>(undefined)

      const childrenProp = React.useMemo(
        () => React.Children.toArray(children),
        [children],
      )

      React.useEffect(() => {
        initSuperCluster()
      }, [childrenProp, clusteringEnabled])

      React.useEffect(() => {
        onRegionChangeComplete()
      }, [region])

      const onRegionChangeComplete = () => {
        if (!superClusterRef.current || !region) return

        const bBox = calculateBBox(region)
        const zoom = returnMapZoom(region, bBox, minZoom!)
        const newClusters = superClusterRef.current.getClusters(bBox, zoom)

        if (animationEnabled) {
          LayoutAnimation.configureNext(layoutAnimationConf!)
        }

        setClusters(newClusters)
        onMarkersChange?.(newClusters)
      }

      const handleOnClusterPress =
        (cluster: MarkerClusterType.Cluster) => () => {
          const children = superClusterRef.current?.getLeaves(
            Number(cluster.id),
            Infinity,
          )

          if (preserveClusterPressBehavior) {
            onPressCluster?.(cluster, children)
            return
          }

          const coordinates = children?.map(({ geometry }) => ({
            latitude: geometry.coordinates[1],
            longitude: geometry.coordinates[0],
          }))

          mapRef?.current?.fitToCoordinates(coordinates, {
            edgePadding: edgePadding,
          })

          onPressCluster?.(cluster, children)
        }

      const initSuperCluster = () => {
        if (!clusteringEnabled) {
          setClusters([])
          superClusterRef.current = undefined
          return
        }

        const rawData: MarkerClusterType.GeoJSONFeature[] = []

        childrenProp.forEach((child, index) => {
          isMarker(child) && rawData.push(markerToGeoJSONFeature(child, index))
        })

        superClusterRef.current = new Supercluster({
          radius: radius,
          maxZoom: maxZoom,
          minZoom: minZoom,
          minPoints: minPoints,
          extent: extent,
          nodeSize: nodeSize,
        })

        superClusterRef.current.load(rawData)

        const bBox = calculateBBox(region!)
        const zoom = returnMapZoom(region!, bBox, minZoom!)
        const newClusters = superClusterRef.current.getClusters(bBox, zoom)

        setClusters(newClusters)
      }

      const renderCluster = (cluster: MarkerClusterType.Cluster) => {
        if (cluster.properties.point_count === 0) {
          return childrenProp[cluster.properties.index]
        }

        if (renderClusterProp) {
          renderClusterProp({
            onPress: handleOnClusterPress(cluster),
            geometry: cluster.geometry,
            properties: cluster.properties,
            tracksViewChanges: tracksViewChanges,
            clusterWrapperBackgroundColor: clusterWrapperBackgroundColor,
            clusterTextColor: clusterTextColor,
            clusterFontFamily: clusterFontFamily,
            clusterBackgroundColor:
              selectedClusterId === cluster.id
                ? selectedClusterColor
                : clusterBackgroundColor,
          })
        }

        return (
          <MarkerClusterItem
            key={`cluster-${cluster.id}`}
            onPress={handleOnClusterPress(cluster)}
            geometry={cluster.geometry}
            properties={cluster.properties}
            tracksViewChanges={tracksViewChanges}
            clusterWrapperBackgroundColor={clusterWrapperBackgroundColor}
            clusterTextColor={clusterTextColor}
            clusterFontFamily={clusterFontFamily}
            clusterBackgroundColor={
              selectedClusterId === cluster.id
                ? selectedClusterColor
                : clusterBackgroundColor
            }
          />
        )
      }

      return <>{clusters.map((m) => renderCluster(m))}</>
    },
  )
