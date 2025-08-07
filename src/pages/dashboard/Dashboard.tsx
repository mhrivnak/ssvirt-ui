import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Gallery,
  GalleryItem,
} from '@patternfly/react-core';

const Dashboard: React.FC = () => {
  return (
    <PageSection>
      <Title headingLevel="h1" size="lg">
        Dashboard
      </Title>
      <Gallery hasGutter>
        <GalleryItem>
          <Card>
            <CardBody>
              <Title headingLevel="h2" size="md">
                Virtual Machines
              </Title>
              <p>Manage your virtual machines</p>
            </CardBody>
          </Card>
        </GalleryItem>
        <GalleryItem>
          <Card>
            <CardBody>
              <Title headingLevel="h2" size="md">
                Organizations
              </Title>
              <p>View and manage organizations</p>
            </CardBody>
          </Card>
        </GalleryItem>
        <GalleryItem>
          <Card>
            <CardBody>
              <Title headingLevel="h2" size="md">
                Virtual Data Centers
              </Title>
              <p>Manage VDCs and resources</p>
            </CardBody>
          </Card>
        </GalleryItem>
        <GalleryItem>
          <Card>
            <CardBody>
              <Title headingLevel="h2" size="md">
                Catalogs
              </Title>
              <p>Browse VM templates and catalogs</p>
            </CardBody>
          </Card>
        </GalleryItem>
      </Gallery>
    </PageSection>
  );
};

export default Dashboard;
