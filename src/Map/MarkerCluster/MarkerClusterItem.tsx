import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Marker } from 'react-native-maps'

import { getStyleProperty, returnMarkerStyle } from '../MapView/helpers'
import type { MarkerClusterType } from '../types'

export const MarkerClusterItem: React.FC<MarkerClusterType.ClusterProps> =
  React.memo(
    ({
      geometry,
      properties,
      clusterBackgroundColor: clusterBackgroundColorProp = (
        size: MarkerClusterType.Size,
      ) =>
        ({
          small: 'rgba(110, 204, 57, 0.6)',
          medium: 'rgba(240, 194, 12, 0.6)',
          large: 'rgba(241, 128, 23, 0.6)',
        })[size],
      clusterFontFamily: clusterFontFamilyProp,
      clusterTextColor: clusterTextColorProp = '#fff',
      clusterWrapperBackgroundColor: clusterWrapperBackgroundColorProp = (
        size: MarkerClusterType.Size,
      ) =>
        ({
          small: 'rgba(181, 226, 140, 0.6)',
          medium: 'rgba(241, 211, 87, 0.6)',
          large: 'rgba(253, 156, 115, 0.6)',
        })[size],
      onPress,
      tracksViewChanges,
    }) => {
      const points = properties.point_count
      const { width, height, fontSize, size } = returnMarkerStyle(points)

      // NOTE: STYLES
      const pointSize = React.useMemo<MarkerClusterType.Size>(
        () => (points < 10 ? 'small' : points < 100 ? 'medium' : 'large'),
        [points],
      )
      const clusterBackgroundColor = React.useMemo(
        () => getStyleProperty(pointSize, clusterBackgroundColorProp),
        [clusterBackgroundColorProp, pointSize],
      )
      const clusterWrapperBackgroundColor = React.useMemo(
        () => getStyleProperty(pointSize, clusterWrapperBackgroundColorProp),
        [clusterWrapperBackgroundColorProp, pointSize],
      )
      const clusterTextColor = React.useMemo(
        () => getStyleProperty(pointSize, clusterTextColorProp),
        [clusterTextColorProp, pointSize],
      )
      const clusterFontFamily = React.useMemo(
        () => getStyleProperty(pointSize, clusterFontFamilyProp),
        [clusterFontFamilyProp, pointSize],
      )

      return (
        <Marker
          key={`${geometry.coordinates[0]}_${geometry.coordinates[1]}`}
          coordinate={{
            longitude: geometry.coordinates[0],
            latitude: geometry.coordinates[1],
          }}
          style={{ zIndex: points + 1 }}
          onPress={onPress}
          tracksViewChanges={tracksViewChanges}
        >
          <TouchableOpacity
            activeOpacity={0.5}
            style={[styles.container, { width, height }]}
          >
            <View
              style={[
                styles.wrapper,
                {
                  backgroundColor: clusterWrapperBackgroundColor,
                  width,
                  height,
                  borderRadius: width / 2,
                },
              ]}
            />
            <View
              style={[
                styles.cluster,
                {
                  backgroundColor: clusterBackgroundColor,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.text,
                  {
                    color: clusterTextColor,
                    fontSize,
                    fontFamily: clusterFontFamily,
                  },
                ]}
              >
                {points}
              </Text>
            </View>
          </TouchableOpacity>
        </Marker>
      )
    },
  )

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    position: 'absolute',
  },
  cluster: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  text: {
    fontWeight: 'bold',
  },
})
