import React from 'react'
import { Dimensions, LayoutAnimation } from 'react-native'
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

export const MarkerCluster: React.FC<MarkerClusterType.WrapperProps> =
  React.memo(
    ({
      children: childrenFromProp,
      clusteringEnabled = true,
      animationEnabled = false,
      preserveClusterPressBehavior = false,
      layoutAnimationConf = LayoutAnimation.Presets.spring,
      tracksViewChanges = false,
      // SuperCluster parameters
      radius = Dimensions.get('window').width * 0.06,
      maxZoom = 16,
      minZoom = 0,
      minPoints = 2,
      extent = 512,
      nodeSize = 64,
      // Map parameters
      edgePadding = { top: 50, left: 50, right: 50, bottom: 50 },
      // Cluster styles
      // spiralEnabled = true,
      // spiderLineColor = '#FF0000',
      // Callbacks
      onPressCluster = () => {},
      onMarkersChange = () => {},
      // custom cluster renderer
      renderCluster: renderClusterFromProp,
      clusterWrapperBackgroundColor,
      clusterTextColor,
      clusterFontFamily,
      selectedClusterId,
      selectedClusterColor,
      clusterBackgroundColor,
    }) => {
      const { region, mapRef } = useMapView()

      const [clusters, setClusters] = React.useState<
        MarkerClusterType.Cluster[]
      >([])
      const superClusterRef = React.useRef<Supercluster | undefined>(undefined)

      const childrenProp = React.useMemo(
        () => React.Children.toArray(childrenFromProp),
        [childrenFromProp],
      )

      React.useEffect(() => {
        initSuperCluster()
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [childrenProp, clusteringEnabled])

      React.useEffect(() => {
        onRegionChangeComplete()
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        if (renderClusterFromProp) {
          renderClusterFromProp({
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
